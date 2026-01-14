// api/start-in-person-scan.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

// Service-role client (server only)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Helper: extract JWT from request
function getAccessToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const accessToken = getAccessToken(req);

  if (!accessToken) {
    return res.status(401).json({ error: "NOT_AUTHENTICATED" });
  }

  // Validate user via Supabase Auth
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !user) {
    return res.status(401).json({ error: "INVALID_SESSION" });
  }

  // Call RPC with explicit user ID
  const { error: rpcError } = await supabaseAdmin.rpc(
    "deduct_credit_for_in_person_scan",
    {
      p_user_id: user.id,
    }
  );

  if (rpcError) {
    if (rpcError.message.includes("INSUFFICIENT_CREDITS")) {
      return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
    }

    console.error("RPC error:", rpcError);
    return res.status(500).json({ error: "CREDIT_DEDUCTION_FAILED" });
  }

  return res.status(200).json({ ok: true });
}
