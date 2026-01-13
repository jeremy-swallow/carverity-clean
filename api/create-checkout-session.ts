// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL =
  process.env.APP_URL || "https://www.carverity.com.au";

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover" as any,
});

// Server-side Supabase client (trusted)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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

    const {
      priceId,
      purchaseType,
      scanId,
    } = req.body as {
      priceId?: string;
      purchaseType?: "credit_pack" | "single_scan";
      scanId?: string;
    };

    if (!priceId || !purchaseType) {
      return res
        .status(400)
        .json({ error: "Missing purchase details" });
    }

    if (purchaseType === "single_scan" && !scanId) {
      return res
        .status(400)
        .json({ error: "Missing scanId for single scan unlock" });
    }

    // Ensure Stripe customer
    let stripeCustomerId =
      user.user_metadata?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            stripe_customer_id: stripeCustomerId,
          },
        }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/pricing?success=true`,
      cancel_url: `${APP_URL}/pricing?canceled=true`,
      metadata: {
        purchase_type: purchaseType,
        ...(scanId ? { scanId } : {}),
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res
      .status(500)
      .json({ error: "Failed to start checkout" });
  }
}
