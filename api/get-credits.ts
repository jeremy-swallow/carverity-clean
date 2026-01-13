// api/get-credits.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

// IMPORTANT: Support both env names on serverless
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    let stripeCustomerId = (user.user_metadata as any)?.stripe_customer_id ?? null;

    // Create Stripe customer once if missing
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

    const customer = await stripe.customers.retrieve(stripeCustomerId);

    if ((customer as any).deleted) {
      return res.status(500).json({ error: "Customer record invalid" });
    }

    const raw = (customer as Stripe.Customer).metadata?.carverity_credits ?? "0";
    const credits = Math.max(0, parseInt(raw, 10) || 0);

    return res.status(200).json({ credits });
  } catch (err) {
    console.error("get-credits error:", err);
    return res.status(500).json({ error: "Failed to load credits" });
  }
}
