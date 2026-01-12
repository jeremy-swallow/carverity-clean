// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  throw new Error("missing_STRIPE_SECRET_KEY");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  // Leave apiVersion undefined to avoid TS literal mismatch
});

/**
 * Single-scan price (existing behaviour)
 */
const SINGLE_SCAN_PRICE_ID = "price_1So9TcE9gXaXx1nSyeYvpaQb";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    /**
     * Two supported flows:
     *
     * 1) Single scan unlock
     *    - requires scanId
     *    - uses fixed SINGLE_SCAN_PRICE_ID
     *
     * 2) Credit pack purchase
     *    - requires priceId
     *    - creates Stripe customer
     *    - credits granted via webhook
     */
    const {
      scanId,
      priceId,
    } = req.body as {
      scanId?: string;
      priceId?: string;
    };

    const origin =
      req.headers.origin || "https://carverity.com.au";

    /**
     * -----------------------------------------------------
     * FLOW 1 — Single scan unlock (UNCHANGED)
     * -----------------------------------------------------
     */
    if (scanId && !priceId) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: SINGLE_SCAN_PRICE_ID,
            quantity: 1,
          },
        ],

        success_url: `${origin}/scan/in-person/unlock/success?scanId=${encodeURIComponent(
          scanId
        )}`,

        cancel_url: `${origin}/scan/in-person/unlock?scanId=${encodeURIComponent(
          scanId
        )}`,

        metadata: {
          scanId,
          purchase_type: "single_scan",
        },
      });

      return res.status(200).json({ url: session.url });
    }

    /**
     * -----------------------------------------------------
     * FLOW 2 — Credit pack purchase
     * -----------------------------------------------------
     */
    if (priceId && !scanId) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],

        // CRITICAL:
        // Always create / reuse a customer so credits persist
        customer_creation: "always",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        success_url: `${origin}/pricing?success=1`,
        cancel_url: `${origin}/pricing?cancelled=1`,

        metadata: {
          purchase_type: "credit_pack",
        },
      });

      return res.status(200).json({ url: session.url });
    }

    /**
     * -----------------------------------------------------
     * Invalid request
     * -----------------------------------------------------
     */
    return res.status(400).json({
      error:
        "Invalid request. Expected either { scanId } or { priceId }.",
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);

    return res.status(500).json({
      error:
        err?.message ||
        "Failed to create checkout session",
    });
  }
}
