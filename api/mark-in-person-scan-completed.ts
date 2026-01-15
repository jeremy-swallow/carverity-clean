import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

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
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    }
  );

  const { scanId } = req.body ?? {};

  if (!scanId) {
    res.status(400).json({ error: "MISSING_SCAN_ID" });
    return;
  }

  const reference = `scan:${scanId}`;

  const { error } = await supabase.rpc(
    "mark_in_person_scan_completed",
    { p_reference: reference }
  );

  if (error) {
    console.error("Failed to mark scan completed:", error.message);
    res.status(500).json({ error: "MARK_COMPLETED_FAILED" });
    return;
  }

  res.status(200).json({ success: true });
}
