import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  const jwt = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.rpc(
    "deduct_credit_for_in_person_scan",
    { p_reference: "scan_start" }
  );

  if (error) {
    console.error("RPC error:", error.message);

    if (error.message.includes("INSUFFICIENT_CREDITS")) {
      res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
      return;
    }

    if (error.message.includes("NOT_AUTHENTICATED")) {
      res.status(401).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    res.status(500).json({ error: "CREDIT_DEDUCTION_FAILED" });
    return;
  }

  res.status(200).json({
    success: true,
    remainingCredits: data?.[0]?.new_balance ?? null,
  });
}
