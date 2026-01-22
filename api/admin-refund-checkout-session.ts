// api/admin-refund-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover" as any,
});

// Trusted server-side Supabase client (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PackKey = "single" | "three" | "five";

const PACK_CREDITS: Record<PackKey, number> = {
  single: 1,
  three: 3,
  five: 5,
};

function normaliseEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

function isAdminEmail(email: string | null | undefined) {
  return normaliseEmail(email) === normaliseEmail(ADMIN_EMAIL);
}

function safeReason(s: unknown) {
  const t = String(s ?? "").trim();
  if (!t) return "";
  return t.slice(0, 240);
}

async function getRequesterUserFromJwtOrThrow(jwt: string) {
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (error || !user) throw new Error("NOT_AUTHENTICATED");
  return user;
}

/**
 * We store a marker reference so the same Stripe session cannot be refunded twice.
 * This uses the existing credit_ledger table (no schema change required).
 */
function refundMarkerReference(sessionId: string) {
  return `stripe_session_refund:${sessionId}`;
}

function purchaseReference(sessionId: string) {
  return `stripe_session_purchase:${sessionId}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "NOT_AUTHENTICATED" });
    }

    const jwt = authHeader.replace("Bearer ", "");

    // Verify requester is admin
    const requester = await getRequesterUserFromJwtOrThrow(jwt);

    if (!isAdminEmail(requester.email)) {
      return res.status(403).json({ error: "NOT_AUTHORIZED" });
    }

    const body = (req.body || {}) as {
      sessionId?: string;
      reason?: string;
    };

    const sessionId = String(body.sessionId ?? "").trim();
    const reason = safeReason(body.reason);

    if (!sessionId || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "INVALID_SESSION_ID" });
    }

    // 1) Retrieve Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND" });
    }

    // Validate it is a credit pack purchase we created
    const purchaseType = String(session.metadata?.purchase_type ?? "");
    const pack = String(session.metadata?.pack ?? "") as PackKey;
    const supabaseUserId = String(session.metadata?.supabase_user_id ?? "");

    if (purchaseType !== "credit_pack") {
      return res.status(400).json({ error: "NOT_A_CREDIT_PACK_PURCHASE" });
    }

    if (!supabaseUserId) {
      return res.status(400).json({ error: "MISSING_SUPABASE_USER_ID" });
    }

    if (!pack || !(pack in PACK_CREDITS)) {
      return res.status(400).json({ error: "INVALID_PACK" });
    }

    const creditsToRestore = PACK_CREDITS[pack];

    // Must have a payment_intent to refund
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "NO_PAYMENT_INTENT_TO_REFUND" });
    }

    // 2) Idempotency guard: check if already refunded in our ledger
    const markerRef = refundMarkerReference(sessionId);

    const { data: existingMarker, error: markerError } = await supabaseAdmin
      .from("credit_ledger")
      .select("id")
      .eq("reference", markerRef)
      .limit(1);

    if (markerError) {
      console.error("[admin-refund-checkout-session] marker lookup error:", markerError);
      return res.status(500).json({ error: "LEDGER_LOOKUP_FAILED" });
    }

    if (Array.isArray(existingMarker) && existingMarker.length > 0) {
      return res.status(409).json({ error: "ALREADY_REFUNDED" });
    }

    // 3) Create Stripe refund
    // Use idempotency key so repeated clicks won't double-refund on Stripe side
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          carverity_action: "admin_refund_credit_pack",
          checkout_session_id: sessionId,
          supabase_user_id: supabaseUserId,
          pack,
          credits_restored: String(creditsToRestore),
          admin_reason: reason || "",
        },
      },
      {
        idempotencyKey: `carverity_refund_${sessionId}`,
      }
    );

    // 4) Restore credits in Supabase (profiles + ledger)
    // Read current credits
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, credits")
      .eq("id", supabaseUserId)
      .single();

    if (profileErr || !profile) {
      console.error("[admin-refund-checkout-session] profile read error:", profileErr);
      return res.status(404).json({ error: "USER_PROFILE_NOT_FOUND" });
    }

    const creditsBefore = Number(profile.credits ?? 0);
    const creditsAfter = creditsBefore + creditsToRestore;

    // Update profile credits
    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ credits: creditsAfter })
      .eq("id", supabaseUserId);

    if (updateErr) {
      console.error("[admin-refund-checkout-session] profile update error:", updateErr);
      return res.status(500).json({ error: "FAILED_TO_UPDATE_CREDITS" });
    }

    // Insert ledger entry (restore credits)
    const purchaseRef = purchaseReference(sessionId);

    const { error: ledgerErr } = await supabaseAdmin.from("credit_ledger").insert([
      {
        user_id: supabaseUserId,
        event_type: "admin_refund_credit_pack",
        credits_delta: creditsToRestore,
        balance_after: creditsAfter,
        reference: purchaseRef,
        note: reason || null,
      } as any,
    ]);

    if (ledgerErr) {
      console.error("[admin-refund-checkout-session] ledger insert error:", ledgerErr);
      // Credits already restored — do not fail hard. Return success with warning.
    }

    // Insert refund marker (prevents repeat refunds)
    const { error: markerInsertErr } = await supabaseAdmin.from("credit_ledger").insert([
      {
        user_id: supabaseUserId,
        event_type: "admin_refund_marker",
        credits_delta: 0,
        balance_after: creditsAfter,
        reference: markerRef,
        note: `Stripe refund id: ${refund.id}`,
      } as any,
    ]);

    if (markerInsertErr) {
      console.error(
        "[admin-refund-checkout-session] marker insert error:",
        markerInsertErr
      );
      // Still return success (Stripe refund already happened)
    }

    return res.status(200).json({
      ok: true,
      refunded: true,
      refund_id: refund.id,
      payment_intent: paymentIntentId,
      session_id: sessionId,
      pack,
      credits_restored: creditsToRestore,
      credits_before: creditsBefore,
      credits_after: creditsAfter,
    });
  } catch (err: any) {
    console.error("[admin-refund-checkout-session] error:", err);

    const msg = String(err?.message || "");

    if (msg === "NOT_AUTHENTICATED") {
      return res.status(401).json({ error: "NOT_AUTHENTICATED" });
    }

    return res.status(500).json({
      error: err?.message || "REFUND_FAILED",
    });
  }
}
