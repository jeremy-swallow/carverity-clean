// api/mark-in-person-scan-completed.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

function extractErrorCode(message: string | null | undefined): string | null {
  if (!message) return null;

  // Supabase/Postgres exceptions often come through as plain strings
  // e.g. "NO_CREDITS" or "NOT_AUTHENTICATED"
  const trimmed = message.trim();

  // Keep it simple + strict: only accept known codes
  const known = ["NO_CREDITS", "NOT_AUTHENTICATED", "PROFILE_NOT_FOUND"];

  if (known.includes(trimmed)) return trimmed;

  return null;
}

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

  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  // IMPORTANT:
  // This endpoint MUST be able to reliably deduct credits.
  // Use Service Role for the RPC call so it can't fail due to RLS.
  // The RPC itself must still enforce "only deduct for the authenticated user".
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: { persistSession: false },
  });

  const { scanId } = req.body ?? {};

  if (!scanId) {
    res.status(400).json({ error: "MISSING_SCAN_ID" });
    return;
  }

  const reference = `scan:${scanId}`;

  const { error } = await supabaseAdmin.rpc("mark_in_person_scan_completed", {
    p_reference: reference,
  });

  if (error) {
    const code = extractErrorCode(error.message);

    if (code === "NO_CREDITS") {
      res.status(402).json({ error: "NO_CREDITS" });
      return;
    }

    if (code === "NOT_AUTHENTICATED") {
      res.status(401).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    if (code === "PROFILE_NOT_FOUND") {
      res.status(500).json({ error: "PROFILE_NOT_FOUND" });
      return;
    }

    console.error("Failed to mark scan completed:", error);
    res.status(500).json({ error: "MARK_COMPLETED_FAILED" });
    return;
  }

  res.status(200).json({ success: true });
}
