// api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   Environment
========================================================= */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

/* =========================================================
   Clients
========================================================= */

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // Stripe SDK expects a newer literal type — cast is intentional and safe
  apiVersion: "2025-12-15.clover" as any,
});

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/* =========================================================
   Helpers
========================================================= */

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
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

async function resolveCreditsGrantedFromSession(
  sessionId: string
): Promise<number> {
  const items = await stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
    expand: ["data.price.product"],
  });

  let total = 0;

  for (const item of items.data) {
    const qty = item.quantity ?? 1;
    const price = item.price;

    const fromPriceMeta = parsePositiveInt(
      price?.metadata?.credits_granted
    );

    let fromProductMeta = 0;
    const product = price?.product;
    if (product && typeof product === "object") {
      const p = product as Stripe.Product;
      fromProductMeta = parsePositiveInt(
        p.metadata?.credits_granted
      );
    }

    const credits = fromPriceMeta || fromProductMeta || 0;
    total += credits * qty;
  }

  return total;
}

/* =========================================================
   Webhook Handler
========================================================= */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    res.status(400).send("Missing stripe-signature header");
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
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    res.status(400).send("Invalid signature");
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

      if (session.metadata?.purchase_type !== "credit_pack") {
        res.status(200).json({ received: true, ignored: "not_credit_pack" });
        return;
      }

      const userId = session.metadata?.user_id;
      if (!userId) {
        res.status(200).json({ received: true, ignored: "no_user_id" });
        return;
      }

      const creditsToAdd = await resolveCreditsGrantedFromSession(session.id);
      if (creditsToAdd <= 0) {
        res.status(200).json({ received: true, ignored: "no_credits" });
        return;
      }

      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        throw new Error("Profile not found for credit grant");
      }

      const newBalance = profile.credits + creditsToAdd;

      await supabaseAdmin
        .from("profiles")
        .update({ credits: newBalance })
        .eq("id", userId);

      res.status(200).json({
        received: true,
        creditsAdded: creditsToAdd,
        newBalance,
      });
      return;
    }

    res.status(200).json({ received: true, ignored: "event_type" });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    res.status(500).send("Webhook handler error");
  }
}
