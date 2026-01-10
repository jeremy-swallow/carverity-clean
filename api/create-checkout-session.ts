// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// CarVerity — In-person inspection unlock ($14.99 AUD)
const PRICE_ID = "price_1So9TcE9gXaXx1nSyeYvpaQb";

/**
 * Resolve the base URL for redirects.
 * Prefers explicit env vars, falls back to request headers.
 */
function getBaseUrl(req: VercelRequest): string {
  const envUrl =
    process.env.VITE_APP_URL ||
    process.env.APP_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl && typeof envUrl === "string") {
    return envUrl.replace(/\/$/, "");
  }

  const proto =
    (req.headers["x-forwarded-proto"] as string) ||
    (req.headers["x-forwarded-protocol"] as string) ||
    "https";

  const host =
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "";

  return `${proto}://${host}`.replace(/\/$/, "");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "method_not_allowed" });
    }

    if (!STRIPE_SECRET_KEY) {
      return res.status(500).json({
        error: "missing_STRIPE_SECRET_KEY",
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body ?? {};

    const scanId = String(body?.scanId ?? "").trim();

    if (!scanId) {
      return res.status(400).json({
        error: "missing_scanId",
      });
    }

    const baseUrl = getBaseUrl(req);

    /**
     * IMPORTANT GUARANTEES
     * --------------------
     * - No unlock here
     * - No analysis here
     * - No API usage here
     * - Checkout session only
     */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/scan/in-person/unlock/success?scanId=${encodeURIComponent(
        scanId
      )}`,
      cancel_url: `${baseUrl}/scan/in-person/unlock?scanId=${encodeURIComponent(
        scanId
      )}`,
      metadata: {
        scanId,
        unlockType: "paid",
      },
    });

    if (!session.url) {
      return res.status(500).json({
        error: "missing_checkout_url",
      });
    }

    return res.status(200).json({
      url: session.url,
    });
  } catch (err: any) {
    console.error("create-checkout-session error:", err);
    return res.status(500).json({
      error: "stripe_checkout_session_failed",
      message: err?.message ?? "unknown_error",
    });
  }
}
