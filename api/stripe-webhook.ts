// api/stripe-webhook.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover" as any,
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* ========================================================= */

type PackKey = "single" | "three" | "five";

function creditsForPack(pack: string | null | undefined): number {
  if (pack === "single") return 1;
  if (pack === "three") return 3;
  if (pack === "five") return 5;
  return 0;
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    res.status(400).end("Invalid signature");
    return;
  }

  // We only care about completed checkouts
  if (event.type !== "checkout.session.completed") {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Only credit paid sessions
  if (session.payment_status !== "paid") {
    res.status(200).json({ ignored: true, reason: "not_paid" });
    return;
  }

  // 🔥 IMPORTANT: match your checkout metadata keys
  const userId =
    session.metadata?.supabase_user_id ||
    session.metadata?.user_id ||
    null;

  const pack = (session.metadata?.pack as PackKey | undefined) ?? undefined;

  // Backwards compatible support if you ever used `credits` directly
  const creditsFromMetadata =
    typeof session.metadata?.credits === "string"
      ? Number(session.metadata?.credits)
      : 0;

  const credits =
    creditsFromMetadata > 0 ? creditsFromMetadata : creditsForPack(pack);

  const paymentIntent = session.payment_intent
    ? String(session.payment_intent)
    : session.id; // fallback

  if (!userId || credits <= 0) {
    res.status(200).json({
      ignored: true,
      reason: "missing_user_or_credits",
      userId,
      pack,
      credits,
    });
    return;
  }

  // ✅ Idempotency guard: if we already credited this payment intent, do nothing
  const { data: existingLedger } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "purchase")
    .eq("reference", paymentIntent)
    .maybeSingle();

  if (existingLedger?.id) {
    res.status(200).json({ ok: true, alreadyCredited: true });
    return;
  }

  // Fetch current balance
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("[stripe-webhook] Failed to load profile:", profileError);
    res.status(500).json({ error: "Failed to load profile" });
    return;
  }

  const current = typeof profile?.credits === "number" ? profile.credits : 0;
  const next = current + credits;

  // Update profile balance
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ credits: next })
    .eq("id", userId);

  if (updateError) {
    console.error("[stripe-webhook] Failed to update credits:", updateError);
    res.status(500).json({ error: "Failed to update credits" });
    return;
  }

  // Insert ledger entry
  const { error: ledgerError } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: userId,
    event_type: "purchase",
    credits_delta: credits,
    balance_after: next,
    reference: paymentIntent,
  });

  if (ledgerError) {
    console.error("[stripe-webhook] Failed to insert ledger:", ledgerError);
    // We already updated credits, so we should still return 200 to prevent Stripe retry loops
    res.status(200).json({ credited: credits, warning: "ledger_insert_failed" });
    return;
  }

  res.status(200).json({ credited: credits, balance_after: next });
}
