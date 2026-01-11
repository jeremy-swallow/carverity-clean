// src/pages/api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("missing_STRIPE_SECRET_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // Leave apiVersion undefined to avoid TS literal mismatches
});

const PRICE_ID = "price_1So9TcE9gXaXx1nSyeYvpaQb"; // $14.99 AUD

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { scanId } = req.body as { scanId?: string };

    if (!scanId) {
      return res.status(400).json({ error: "Missing scanId" });
    }

    const origin =
      req.headers.origin ||
      "https://www.carverity.com.au";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: PRICE_ID, quantity: 1 }],

      // ✅ MUST return through unlock success so scan is unlocked
      success_url: `${origin}/scan/in-person/unlock/success?scanId=${encodeURIComponent(
        scanId
      )}&session_id={CHECKOUT_SESSION_ID}`,

      // User cancels → return to unlock screen
      cancel_url: `${origin}/scan/in-person/unlock?scanId=${encodeURIComponent(
        scanId
      )}`,

      metadata: { scanId },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({
      error:
        err?.message ||
        "Failed to create checkout session",
    });
  }
}
