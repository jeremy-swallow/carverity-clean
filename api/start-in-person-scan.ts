import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_ANON_KEY) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

/**
 * Admin client (not used for the RPC call, but kept here if you expand later).
 * Important: we DO NOT deduct credits with service role.
 */
createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  // Caller may pass a stable idempotency reference. If not, we generate one.
  let reference: string | null = null;

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    reference =
      typeof body?.reference === "string" && body.reference.trim().length > 0
        ? body.reference.trim()
        : null;
  } catch {
    // ignore malformed JSON; we'll still proceed with a generated reference
    reference = null;
  }

  if (!reference) {
    reference = crypto.randomUUID();
  }

  // User-scoped Supabase client (executes RPC under the user's auth context)
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("deduct_credit_for_in_person_scan", {
    in_reference: reference,
  });

  if (error) {
    const msg = error.message || "";

    console.error("Credit deduction failed:", msg);

    if (msg.includes("INSUFFICIENT_CREDITS")) {
      res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
      return;
    }

    if (msg.includes("NOT_AUTHENTICATED")) {
      res.status(401).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    res.status(500).json({ error: "CREDIT_DEDUCTION_FAILED" });
    return;
  }

  // Supabase RPC returns rows; our function returns table(new_balance int4)
  const remainingCredits =
    Array.isArray(data) && data.length > 0 ? data[0]?.new_balance ?? null : null;

  res.status(200).json({
    success: true,
    reference,
    remainingCredits,
  });
}
