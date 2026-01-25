// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// NOTE:
// Do NOT hardcode www/non-www here.
// We MUST redirect back to the SAME origin the user started on,
// otherwise Supabase localStorage session won’t exist (looks “logged out”).
const APP_URL_FALLBACK = process.env.APP_URL || "https://www.carverity.com.au";

if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!SUPABASE_URL) throw new Error("Missing VITE_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover" as any,
});

// Trusted server-side Supabase client (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* =========================================================
   Stripe price map (TEST MODE)
   ✅ Replace with YOUR real Stripe TEST price IDs
========================================================= */

type PackKey = "single" | "three" | "five";

const PRICE_MAP: Record<PackKey, string> = {
  single: "price_1So9TcE9gXaXx1nSyeYvpaQb",
  three: "price_1SoppbE9gXaXx1nSfp5Xex9O",
  five: "price_1SoprRE9gXaXx1nSnlKEnh0U",
};

function getRequestOrigin(req: VercelRequest): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) || "https";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) || req.headers.host;

  if (host) return `${proto}://${host}`;
  return APP_URL_FALLBACK;
}

function asSafeScanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;

  // Accept UUID-ish strings (what your scan IDs are)
  // Keep it strict to avoid URL injection / garbage.
  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  return uuidLike ? v : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify Supabase user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    const { pack, scanId } = (req.body || {}) as {
      pack?: PackKey;
      scanId?: string | null;
    };

    if (!pack || !PRICE_MAP[pack]) {
      return res.status(400).json({ error: "Invalid pack" });
    }

    const safeScanId = asSafeScanId(scanId);

    // Validate price exists for this Stripe key (clear error if mismatch)
    try {
      await stripe.prices.retrieve(PRICE_MAP[pack]);
    } catch (e: any) {
      console.error("[create-checkout-session] Invalid price for Stripe key", {
        pack,
        priceId: PRICE_MAP[pack],
        stripeErrorType: e?.type,
        stripeErrorCode: e?.code,
        stripeMessage: e?.message,
      });
      return res.status(400).json({
        error:
          "Invalid priceId for this Stripe key (test/live mismatch or wrong account).",
      });
    }

    const origin = getRequestOrigin(req);

    // IMPORTANT:
    // Stripe should return to a dedicated "success" route (not Pricing),
    // so the user continues their scan reliably.
    const successParams = new URLSearchParams();
    successParams.set("restore", "1");
    if (safeScanId) {
      successParams.set("scanId", safeScanId);
    }

    const cancelParams = new URLSearchParams();
    cancelParams.set("cancelled", "1");
    if (safeScanId) {
      cancelParams.set("scanId", safeScanId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_MAP[pack], quantity: 1 }],

      // IMPORTANT:
      // 1) Use SAME origin as the current app session (prevents “logged out” look)
      // 2) Route back to unlock success so the user continues the scan flow
      success_url: `${origin}/scan/in-person/unlock/success?${successParams.toString()}`,
      cancel_url: `${origin}/pricing?${cancelParams.toString()}`,

      metadata: {
        purchase_type: "credit_pack",
        supabase_user_id: user.id,
        pack,
        ...(safeScanId ? { scanId: safeScanId } : {}),
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("[create-checkout-session] error:", err);
    return res.status(500).json({
      error: err?.message || "Failed to start checkout",
    });
  }
}
