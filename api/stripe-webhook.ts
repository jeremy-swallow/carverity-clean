// src/pages/api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20" as any,
});

/* =========================================================
   Raw body reader (required for Stripe signature verification)
========================================================= */
async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parsePositiveInt(value: unknown): number {
  const n =
    typeof value === "string"
      ? parseInt(value, 10)
      : typeof value === "number"
      ? value
      : NaN;

  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/* =========================================================
   Credits grant strategy (server-side, persistent)
   - Balance stored on Stripe Customer metadata: carverity_credits
   - Idempotency stored on PaymentIntent metadata: carverity_credits_applied
========================================================= */

async function resolveCreditsGrantedFromSession(
  sessionId: string
): Promise<number> {
  const items = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price"],
  });

  let total = 0;

  for (const item of items.data) {
    const qty = item.quantity ?? 1;

    const price = item.price;
    const fromPriceMeta = parsePositiveInt(price?.metadata?.credits_granted);

    // Fallback: some setups may attach credits metadata to the product instead
    let fromProductMeta = 0;
    if (price?.product && typeof price.product === "string") {
      // If product is not expanded, we can't read metadata here; keep as 0.
      fromProductMeta = 0;
    } else if (price?.product && typeof price.product === "object") {
      const productObj = price.product as Stripe.Product;
      fromProductMeta = parsePositiveInt(productObj.metadata?.credits_granted);
    }

    const creditsForThisLine = fromPriceMeta || fromProductMeta || 0;
    total += creditsForThisLine * qty;
  }

  return total;
}

async function ensureCustomerIdFromSession(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const customer = session.customer;

  if (typeof customer === "string" && customer) return customer;

  // If Checkout wasn't configured to always create a customer, we may only have email.
  // We'll create a customer to persist credits going forward.
  const email = session.customer_details?.email ?? null;
  if (!email) return null;

  const created = await stripe.customers.create({
    email,
    metadata: {
      carverity_created_from: "checkout_session_completed",
    },
  });

  return created.id;
}

async function grantCreditsToCustomer(params: {
  customerId: string;
  creditsToAdd: number;
  paymentIntentId: string;
}): Promise<void> {
  const { customerId, creditsToAdd, paymentIntentId } = params;

  // Idempotency gate: mark credits applied on the PaymentIntent
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.metadata?.carverity_credits_applied === "true") {
    return;
  }

  // Load current balance from customer metadata
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) {
    return;
  }

  const current = parsePositiveInt(customer.metadata?.carverity_credits);
  const next = current + creditsToAdd;

  // Update customer balance
  await stripe.customers.update(customerId, {
    metadata: {
      ...customer.metadata,
      carverity_credits: String(next),
    },
  });

  // Mark as applied (idempotent)
  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      ...pi.metadata,
      carverity_credits_applied: "true",
      carverity_credits_added: String(creditsToAdd),
    },
  });
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    res.status(400).send("Missing stripe-signature header.");
    return;
  }

  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch {
    res.status(400).send("Webhook signature verification failed.");
    return;
  }

  try {
    // We grant credits when Checkout completes successfully and is paid.
    // Handle both immediate and async payment success paths.
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      // Only act on paid sessions
      if (session.payment_status !== "paid") {
        res.status(200).json({ received: true, ignored: "not_paid" });
        return;
      }

      // We need a PaymentIntent for idempotency
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (!paymentIntentId) {
        res.status(200).json({ received: true, ignored: "no_payment_intent" });
        return;
      }

      // Determine credits from line item price metadata
      const creditsToAdd = await resolveCreditsGrantedFromSession(session.id);

      // If this session is NOT a credit pack purchase, we do nothing.
      // (This preserves your existing single-scan unlock flow.)
      if (creditsToAdd <= 0) {
        res.status(200).json({ received: true, ignored: "no_credits_in_meta" });
        return;
      }

      const customerId = await ensureCustomerIdFromSession(session);

      if (!customerId) {
        res.status(200).json({ received: true, ignored: "no_customer" });
        return;
      }

      await grantCreditsToCustomer({
        customerId,
        creditsToAdd,
        paymentIntentId,
      });

      res.status(200).json({ received: true, creditsAdded: creditsToAdd });
      return;
    }

    // Ignore other events
    res.status(200).json({ received: true, ignored: "event_type" });
  } catch {
    // Stripe expects 2xx for successful receipt; but if we error here,
    // Stripe will retry — which is safe due to idempotency.
    res.status(500).send("Webhook handler error.");
  }
}
