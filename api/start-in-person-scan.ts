// api/start-in-person-scan.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "NOT_AUTHENTICATED" });
  }

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "NOT_AUTHENTICATED" });
  }

  const { error } = await supabaseAdmin.rpc(
    "deduct_credit_for_in_person_scan"
  );

  if (error) {
    if (error.message.includes("NO_CREDITS")) {
      return res.status(402).json({ error: "NO_CREDITS" });
    }

    console.error("Credit deduction failed:", error);
    return res.status(500).json({ error: "FAILED_TO_DEDUCT_CREDIT" });
  }

  return res.status(200).json({ ok: true });
}
