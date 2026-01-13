// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      priceId,
      scanId,
    }: { priceId?: string; scanId?: string } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    const origin =
      req.headers.origin || "https://carverity.com.au";

    const isScanUnlock = Boolean(scanId);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      success_url: isScanUnlock
        ? `${origin}/scan/in-person/unlock/success?scanId=${encodeURIComponent(
            scanId!
          )}`
        : `${origin}/pricing?success=true`,

      cancel_url: isScanUnlock
        ? `${origin}/scan/in-person/unlock?scanId=${encodeURIComponent(
            scanId!
          )}`
        : `${origin}/pricing?canceled=true`,

      metadata: {
        ...(scanId ? { scanId } : {}),
        purchase_type: isScanUnlock
          ? "scan_unlock"
          : "credit_pack",
      },
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
