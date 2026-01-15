// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const APP_URL = process.env.APP_URL || "https://www.carverity.com.au";

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!SUPABASE_URL) {
  throw new Error("Missing VITE_SUPABASE_URL");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

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

    const { pack } = (req.body || {}) as { pack?: PackKey };

    if (!pack || !PRICE_MAP[pack]) {
      return res.status(400).json({ error: "Invalid pack" });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: PRICE_MAP[pack], quantity: 1 }],
      success_url: `${APP_URL}/pricing?success=1&restore=1`,
      cancel_url: `${APP_URL}/pricing?cancelled=1`,
      metadata: {
        purchase_type: "credit_pack",
        supabase_user_id: user.id,
        pack,
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
