// api/check-in-person-unlock.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

function safeJson<T = any>(value: any): T | null {
  if (!value) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  const body =
    safeJson<{ scanId?: string; reference?: string }>(req.body) || {};
  const scanId = (body.scanId || "").trim();
  const providedReference = (body.reference || "").trim();

  if (!scanId) {
    res.status(400).json({ error: "MISSING_SCAN_ID" });
    return;
  }

  // Stable reference for this scan (ledger + idempotency)
  const reference = providedReference || `scan:${scanId}`;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: { persistSession: false },
  });

  /**
   * Unlock = credit has been spent for this scan.
   *
   * With Model B, we spend at analysis start (unlock),
   * and your SQL logs that as:
   * event_type = 'in_person_scan_completed'
   */
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("id")
    .eq("event_type", "in_person_scan_completed")
    .eq("reference", reference)
    .limit(1);

  if (error) {
    console.error("Unlock ledger check error:", error.message);

    if (error.message.includes("NOT_AUTHENTICATED")) {
      res.status(401).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    res.status(500).json({ error: "CHECK_FAILED" });
    return;
  }

  const unlocked = Array.isArray(data) && data.length > 0;

  res.status(200).json({
    unlocked,
    reference,
  });
}
