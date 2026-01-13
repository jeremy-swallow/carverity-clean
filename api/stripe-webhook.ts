// api/stripe-webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

async function resolveCreditsGrantedFromSession(sessionId: string): Promise<number> {
  const items = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"], // IMPORTANT: expand product so we can read metadata
  });

  let total = 0;

  for (const item of items.data) {
    const qty = item.quantity ?? 1;
    const price = item.price;

    const fromPriceMeta = parsePositiveInt(price?.metadata?.credits_granted);

    let fromProductMeta = 0;
    const product = price?.product;
    if (product && typeof product === "object") {
      const productObj = product as Stripe.Product;
      fromProductMeta = parsePositiveInt(productObj.metadata?.credits_granted);
    }

    const creditsForThisLine = fromPriceMeta || fromProductMeta || 0;
    total += creditsForThisLine * qty;
  }

  return total;
}

async function ensureCustomerIdFromSession(session: Stripe.Checkout.Session): Promise<string | null> {
  const customer = session.customer;

  if (typeof customer === "string" && customer) return customer;
  if (typeof customer === "object" && customer?.id) return customer.id;

  const email = session.customer_details?.email ?? null;
  if (!email) return null;

  const created = await stripe.customers.create({
    email,
    metadata: { carverity_created_from: "webhook_checkout_session" },
  });

  return created.id;
}

/**
 * If we had to create a customer in the webhook (because session.customer was null),
 * attempt to attach that customer ID to the Supabase user by matching email.
 * (This prevents "credits = 0" caused by customer mismatch.)
 */
async function linkCustomerToSupabaseUserByEmail(email: string, stripeCustomerId: string) {
  try {
    // listUsers() doesn't support direct email filter in all versions; we filter in memory.
    // For your app scale, this is fine. If you grow big, move this to a profiles table.
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error || !data?.users?.length) return;

    const match = data.users.find(
      (u) => (u.email || "").toLowerCase() === email.toLowerCase()
    );
    if (!match) return;

    const existing = (match.user_metadata as any)?.stripe_customer_id;
    if (existing && existing === stripeCustomerId) return;

    await supabaseAdmin.auth.admin.updateUserById(match.id, {
      user_metadata: {
        ...(match.user_metadata as any),
        stripe_customer_id: stripeCustomerId,
      },
    });
  } catch (e) {
    console.error("linkCustomerToSupabaseUserByEmail failed:", e);
  }
}

async function grantCreditsToCustomer(params: {
  customerId: string;
  creditsToAdd: number;
  paymentIntentId: string;
}): Promise<{ newBalance: number } | null> {
  const { customerId, creditsToAdd, paymentIntentId } = params;

  // Idempotency gate: mark credits applied on the PaymentIntent
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.metadata?.carverity_credits_applied === "true") {
    return null;
  }

  const customer = await stripe.customers.retrieve(customerId);
  if ((customer as any).deleted) return null;

  const current = parsePositiveInt((customer as Stripe.Customer).metadata?.carverity_credits);
  const next = current + creditsToAdd;

  await stripe.customers.update(customerId, {
    metadata: {
      ...(customer as Stripe.Customer).metadata,
      carverity_credits: String(next),
    },
  });

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      ...pi.metadata,
      carverity_credits_applied: "true",
      carverity_credits_added: String(creditsToAdd),
    },
  });

  return { newBalance: next };
}

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
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    res.status(400).send("Webhook signature verification failed.");
    return;
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        res.status(200).json({ received: true, ignored: "not_paid" });
        return;
      }

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (!paymentIntentId) {
        res.status(200).json({ received: true, ignored: "no_payment_intent" });
        return;
      }

      // Only grant credits for credit packs (not single-scan unlock)
      const purchaseType = session.metadata?.purchase_type ?? null;
      if (purchaseType !== "credit_pack") {
        res.status(200).json({ received: true, ignored: "not_credit_pack" });
        return;
      }

      const creditsToAdd = await resolveCreditsGrantedFromSession(session.id);
      if (creditsToAdd <= 0) {
        res.status(200).json({ received: true, ignored: "no_credits_in_meta" });
        return;
      }

      const customerId = await ensureCustomerIdFromSession(session);
      if (!customerId) {
        res.status(200).json({ received: true, ignored: "no_customer" });
        return;
      }

      // If customer was missing, try to link it to Supabase user via email to prevent mismatch
      const email = session.customer_details?.email ?? null;
      if (email) {
        await linkCustomerToSupabaseUserByEmail(email, customerId);
      }

      const applied = await grantCreditsToCustomer({
        customerId,
        creditsToAdd,
        paymentIntentId,
      });

      res.status(200).json({
        received: true,
        creditsAdded: creditsToAdd,
        newBalance: applied?.newBalance ?? null,
      });
      return;
    }

    res.status(200).json({ received: true, ignored: "event_type" });
  } catch (err) {
    console.error("stripe-webhook handler error:", err);
    // Stripe will retry; safe due to idempotency.
    res.status(500).send("Webhook handler error.");
  }
}
