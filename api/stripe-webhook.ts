// api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover" as any,
});

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/* ========================================================= */

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || Array.isArray(sig)) {
    res.status(400).end("Missing signature");
    return;
  }

  let event: Stripe.Event;

  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(err);
    res.status(400).end("Invalid signature");
    return;
  }

  if (event.type !== "checkout.session.completed") {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    res.status(200).json({ ignored: true });
    return;
  }

  const userId = session.metadata?.user_id;
  const credits = Number(session.metadata?.credits || 0);
  const paymentIntent = String(session.payment_intent);

  if (!userId || credits <= 0) {
    res.status(200).json({ ignored: true });
    return;
  }

  // Fetch current balance
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  const current = profile?.credits ?? 0;
  const next = current + credits;

  // Update profile balance
  await supabaseAdmin
    .from("profiles")
    .update({ credits: next })
    .eq("id", userId);

  // Insert ledger entry
  await supabaseAdmin.from("credit_ledger").insert({
    user_id: userId,
    event_type: "purchase",
    credits_delta: credits,
    balance_after: next,
    reference: paymentIntent,
  });

  res.status(200).json({ credited: credits });
}
