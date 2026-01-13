// api/create-checkout-session.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/**
 * IMPORTANT:
 * - Do NOT throw at module scope in Vercel Serverless functions.
 *   Top-level throws can surface as FUNCTION_INVOCATION_FAILED before we can return JSON.
 * - Be explicit about body parsing because req.body can be a string depending on runtime.
 */

type PurchaseType = "credit_pack" | "single_scan";

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

function safeJsonParse(body: unknown): any {
  if (body == null) return {};
  if (typeof body === "object") return body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

function isTestKey(key: string): boolean {
  return key.startsWith("sk_test_");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always return JSON
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const baseUrl = getBaseUrl(req);

  // Read env vars INSIDE handler so we can return a useful error instead of crashing the function
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";

  // IMPORTANT: On Vercel serverless, VITE_* env vars are NOT guaranteed unless you also set them.
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // Basic diagnostics (no secrets)
  const requestId =
    (req.headers["x-vercel-id"] as string | undefined) ||
    (req.headers["x-request-id"] as string | undefined) ||
    undefined;

  try {
    if (!STRIPE_SECRET_KEY) {
      console.error("[create-checkout-session] Missing STRIPE_SECRET_KEY", {
        requestId,
      });
      return res.status(500).json({
        error:
          "Server misconfigured: missing STRIPE_SECRET_KEY. Set it in Vercel environment variables.",
      });
    }

    if (!SUPABASE_URL) {
      console.error(
        "[create-checkout-session] Missing SUPABASE_URL (or VITE_SUPABASE_URL)",
        { requestId }
      );
      return res.status(500).json({
        error:
          "Server misconfigured: missing SUPABASE_URL (or VITE_SUPABASE_URL). Set it in Vercel environment variables.",
      });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[create-checkout-session] Missing SUPABASE_SERVICE_ROLE_KEY",
        { requestId }
      );
      return res.status(500).json({
        error:
          "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel environment variables.",
      });
    }

    const authHeader = req.headers.authorization;
    const hasBearer = Boolean(authHeader && authHeader.startsWith("Bearer "));
    if (!hasBearer) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader!.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Parse body safely (req.body may be string in some environments)
    const body = safeJsonParse(req.body);

    const { priceId, purchaseType, scanId } = (body || {}) as {
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

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      // Pin an apiVersion so behavior is stable across deployments.
      // If you already pinned this elsewhere, keep it consistent.
      apiVersion: "2025-11-17.clover" as any,
    });

    // Server-side Supabase client (trusted)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify Supabase user from access token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("[create-checkout-session] Invalid user token", {
        requestId,
        supabaseError: userError?.message,
      });
      return res.status(401).json({ error: "Invalid user" });
    }

    // Validate price early to surface test/live mismatch cleanly
    try {
      await stripe.prices.retrieve(priceId);
    } catch (e: any) {
      console.error("[create-checkout-session] Invalid priceId for key", {
        requestId,
        priceId,
        stripeKeyMode: isTestKey(STRIPE_SECRET_KEY) ? "test" : "live",
        stripeErrorType: e?.type,
        stripeErrorCode: e?.code,
        stripeMessage: e?.message,
      });

      return res.status(400).json({
        error:
          "Invalid priceId for this Stripe key (test/live mismatch, wrong account, or price not found).",
      });
    }

    // Ensure Stripe customer ID exists in Supabase user_metadata
    let stripeCustomerId =
      (user.user_metadata as any)?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });

      stripeCustomerId = customer.id;

      // Best-effort metadata update (do not fail checkout creation if this update fails)
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata as any),
            stripe_customer_id: stripeCustomerId,
          },
        });
      } catch (e: any) {
        console.error(
          "[create-checkout-session] Failed to persist stripe_customer_id to user_metadata",
          { requestId, supabaseUserId: user.id, message: e?.message }
        );
      }
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

      // Webhook routing metadata
      metadata: {
        purchase_type: purchaseType,
        supabase_user_id: user.id,
        ...(scanId ? { scanId } : {}),
      },
    });

    if (!session.url) {
      console.error("[create-checkout-session] Stripe session missing URL", {
        requestId,
        sessionId: session.id,
      });
      return res.status(500).json({
        error:
          "Stripe session was created but did not return a redirect URL. Check Stripe API version and Checkout settings.",
      });
    }

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err: any) {
    console.error("[create-checkout-session] Unhandled error", {
      requestId,
      baseUrl,
      message: err?.message,
      name: err?.name,
      type: err?.type,
      code: err?.code,
      stack: err?.stack,
    });

    return res.status(500).json({
      error: "Failed to start checkout",
    });
  }
}
