// api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

/* =========================================================
   Raw body reader (required for Stripe signature verification)
========================================================= */
async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseNonNegativeInt(value: unknown): number {
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
   Price → credits mapping (authoritative)
========================================================= */

const PRICE_TO_CREDITS: Record<string, number> = {
  price_1So9TcE9gXaXx1nSyeYvpaQb: 1,
  price_1SoppbE9gXaXx1nSfp5Xex9O: 3,
  price_1SoprRE9gXaXx1nSnlKEnh0U: 5,
};

/* =========================================================
   Customer helpers
========================================================= */

async function ensureCustomerIdFromSession(
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const customer = session.customer;

  if (typeof customer === "string" && customer) return customer;

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

/**
 * Idempotency: we store a small marker on the customer metadata:
 *   carverity_last_credit_session = <session.id>
 * If we see the same session again, we do nothing.
 *
 * This is intentionally simple and stable.
 */
async function grantCreditsToCustomer(params: {
  customerId: string;
  sessionId: string;
  creditsToAdd: number;
}): Promise<void> {
  const { customerId, sessionId, creditsToAdd } = params;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const alreadyProcessed =
    customer.metadata?.carverity_last_credit_session === sessionId;

  if (alreadyProcessed) return;

  const current = parseNonNegativeInt(customer.metadata?.carverity_credits);
  const next = current + creditsToAdd;

  await stripe.customers.update(customerId, {
    metadata: {
      ...customer.metadata,
      carverity_credits: String(next),
      carverity_last_credit_session: sessionId,
    },
  });
}

/* =========================================================
   Handler
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Missing stripe-signature header");
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
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return res.status(200).json({ received: true, ignored: "not_paid" });
    }

    const items = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 10,
    });

    let creditsToAdd = 0;

    for (const item of items.data) {
      const priceId = item.price?.id;
      if (!priceId) continue;

      const perUnit = PRICE_TO_CREDITS[priceId];
      if (!perUnit) continue;

      const qty = item.quantity ?? 1;
      creditsToAdd += perUnit * qty;
    }

    if (creditsToAdd <= 0) {
      return res.status(200).json({
        received: true,
        ignored: "no_matching_price",
      });
    }

    const customerId = await ensureCustomerIdFromSession(session);

    if (!customerId) {
      return res.status(200).json({
        received: true,
        ignored: "no_customer",
      });
    }

    await grantCreditsToCustomer({
      customerId,
      sessionId: session.id,
      creditsToAdd,
    });

    return res.status(200).json({
      received: true,
      creditsAdded: creditsToAdd,
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return res.status(500).send("Webhook handler error");
  }
}
