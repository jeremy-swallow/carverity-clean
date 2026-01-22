// api/start-in-person-scan.ts

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

  const body = safeJson<{ scanId?: string }>(req.body) || {};
  const scanId = (body.scanId || "").trim();

  if (!scanId) {
    res.status(400).json({ error: "MISSING_SCAN_ID" });
    return;
  }

  // We keep the reference format consistent across the app.
  const reference = `scan:${scanId}`;

  // This endpoint now only verifies auth and returns a stable reference.
  // No credit is deducted here.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: { persistSession: false },
  });

  // Optional sanity check: verify the JWT is valid
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  res.status(200).json({
    success: true,
    reference,
    message: "Inspection started (no credits used yet).",
  });
}
