// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

// IMPORTANT: On Vercel serverless, VITE_* env vars are NOT guaranteed unless you also set them.
// So we support both names.
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// If APP_URL isn't set, use the current request host (works for prod + preview domains)
function getBaseUrl(req: VercelRequest): string {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const xfHost = req.headers["x-forwarded-host"];
  const host =
    (Array.isArray(xfHost) ? xfHost[0] : xfHost) ||
    req.headers.host ||
    "localhost:3000";

  const xfProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(xfProto) ? xfProto[0] : xfProto) || "https";

  return `${proto}://${host}`.replace(/\/+$/, "");
}

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Server-side Supabase client (trusted)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PurchaseType = "credit_pack" | "single_scan";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const baseUrl = getBaseUrl(req);

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

    const { priceId, purchaseType, scanId } = (req.body || {}) as {
      priceId?: string;
      purchaseType?: PurchaseType;
      scanId?: string;
    };

    if (!priceId || !purchaseType) {
      return res.status(400).json({ error: "Missing purchase details" });
    }

    if (purchaseType === "single_scan" && !scanId) {
      return res
        .status(400)
        .json({ error: "Missing scanId for single scan unlock" });
    }

    // Validate price early to surface "test/live mismatch" cleanly
    try {
      await stripe.prices.retrieve(priceId);
    } catch (e) {
      return res.status(400).json({
        error:
          "Invalid priceId for this Stripe key (test/live mismatch or wrong account).",
      });
    }

    // Ensure Stripe customer (store ID on Supabase user metadata)
    let stripeCustomerId = (user.user_metadata as any)?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });

      stripeCustomerId = customer.id;

      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata as any),
          stripe_customer_id: stripeCustomerId,
        },
      });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],

      // Helps keep customer details up to date
      customer_update: {
        address: "auto",
        name: "auto",
      },

      success_url: `${baseUrl}/pricing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,

      // Metadata is what your webhook uses to decide what to do
      metadata: {
        purchase_type: purchaseType,
        supabase_user_id: user.id,
        ...(scanId ? { scanId } : {}),
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Failed to start checkout" });
  }
}
