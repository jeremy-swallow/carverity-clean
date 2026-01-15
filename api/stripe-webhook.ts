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
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover" as any,
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* =========================================================
   Helpers
========================================================= */

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

type PackKey = "single" | "three" | "five";

function packToCredits(pack: string | null | undefined): number {
  if (pack === "single") return 1;
  if (pack === "three") return 3;
  if (pack === "five") return 5;
  return 0;
}

async function getCurrentCredits(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    // If the profile row doesn't exist yet, treat as 0
    return 0;
  }

  const current = (data as any)?.credits;
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

async function ensureLedgerNotCredited(reference: string): Promise<boolean> {
  // Returns true if we can proceed (not already credited)
  const { data, error } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("event_type", "purchase")
    .eq("reference", reference)
    .limit(1);

  if (error) {
    // If ledger query fails, fail safe by allowing crediting
    // (better than blocking purchases due to a temporary DB issue)
    return true;
  }

  return !(data && data.length > 0);
}

/* =========================================================
   Handler
========================================================= */

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

  // We only care about completed checkout sessions for credit packs
  if (event.type !== "checkout.session.completed") {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    res.status(200).json({ ignored: true, reason: "not_paid" });
    return;
  }

  // Your create-checkout-session.ts uses:
  // metadata: { purchase_type: "credit_pack", supabase_user_id: user.id, pack }
  const purchaseType = session.metadata?.purchase_type ?? null;
  const userId = session.metadata?.supabase_user_id ?? null;
  const pack = (session.metadata?.pack ?? null) as PackKey | null;

  if (purchaseType !== "credit_pack") {
    res.status(200).json({ ignored: true, reason: "not_credit_pack" });
    return;
  }

  if (!userId) {
    res.status(200).json({ ignored: true, reason: "missing_user_id" });
    return;
  }

  const creditsToAdd = packToCredits(pack);
  if (creditsToAdd <= 0) {
    res.status(200).json({ ignored: true, reason: "invalid_pack" });
    return;
  }

  // Use a stable reference for idempotency (payment_intent preferred)
  const reference =
    typeof session.payment_intent === "string" && session.payment_intent
      ? session.payment_intent
      : session.id;

  // Prevent double-crediting if Stripe retries delivery
  const canProceed = await ensureLedgerNotCredited(reference);
  if (!canProceed) {
    res.status(200).json({ ok: true, already_credited: true });
    return;
  }

  // Fetch current balance
  const current = await getCurrentCredits(userId);
  const next = current + creditsToAdd;

  // Update profile balance
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ credits: next })
    .eq("id", userId);

  if (updateError) {
    console.error("[stripe-webhook] Failed to update profile credits:", updateError);
    res.status(500).json({ error: "Failed to update credits" });
    return;
  }

  // Insert ledger entry (best effort)
  const { error: ledgerError } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: userId,
    event_type: "purchase",
    credits_delta: creditsToAdd,
    balance_after: next,
    reference,
    meta: {
      pack,
      session_id: session.id,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? null,
    },
  });

  if (ledgerError) {
    // Not fatal — credits already updated
    console.warn("[stripe-webhook] Ledger insert failed:", ledgerError);
  }

  res.status(200).json({
    ok: true,
    credited: creditsToAdd,
    balance_after: next,
    reference,
  });
}
