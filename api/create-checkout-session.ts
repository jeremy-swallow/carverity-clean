// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // IMPORTANT:
  // Leave apiVersion undefined to avoid TS literal mismatch.
});

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { priceId } = req.body as { priceId?: string };

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    // Map Stripe Price IDs → credits granted
    const PRICE_TO_CREDITS: Record<string, number> = {
      "price_1So9TcE9gXaXx1nSyeYvpaQb": 1, // single
      "price_1SoppbE9gXaXx1nSfp5Xex9O": 3, // 3-pack
      "price_1SoprRE9gXaXx1nSnlKEnh0U": 5, // 5-pack
    };

    const creditsGranted = PRICE_TO_CREDITS[priceId];

    if (!creditsGranted) {
      return res.status(400).json({ error: "Unknown priceId" });
    }

    // Auth
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // Ensure Stripe customer
    let stripeCustomerId = (user.user_metadata as any)?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata as any),
          stripe_customer_id: stripeCustomerId,
        },
      });
    }

    const origin = req.headers.origin || "https://www.carverity.com.au";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        purchase_type: "credit_pack",
        credits_granted: String(creditsGranted),
        supabase_user_id: user.id,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({ error: "Failed to start checkout" });
  }
}
