import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_ANON_KEY) throw new Error("Missing VITE_SUPABASE_ANON_KEY");

function cleanEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

function safeString(v: any) {
  return String(v ?? "").trim();
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

  // Identify caller using user JWT
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabaseUser.auth.getUser();

  if (userErr || !user) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  const callerEmail = cleanEmail(user.email);
  if (callerEmail !== cleanEmail(ADMIN_EMAIL)) {
    res.status(403).json({ error: "NOT_AUTHORIZED" });
    return;
  }

  const { scanId } = req.body ?? {};
  const cleanScanId = safeString(scanId);

  if (!cleanScanId) {
    res.status(400).json({ error: "MISSING_SCAN_ID" });
    return;
  }

  // Service role client (admin)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Find scan row
  const { data: scanRow, error: scanErr } = await supabaseAdmin
    .from("scans")
    .select("scan_id, user_id, created_at")
    .eq("scan_id", cleanScanId)
    .maybeSingle();

  if (scanErr) {
    console.error("admin-force-unlock scan lookup failed:", scanErr);
    res.status(500).json({ error: "SCAN_LOOKUP_FAILED" });
    return;
  }

  if (!scanRow) {
    res.status(404).json({ error: "SCAN_NOT_FOUND" });
    return;
  }

  const ownerUserId = (scanRow as any).user_id as string | null;

  if (!ownerUserId) {
    res.status(500).json({ error: "SCAN_MISSING_OWNER" });
    return;
  }

  const reference = `scan:${cleanScanId}`;

  // New marker (clean)
  const NEW_MARKER = "in_person_unlock";

  // Old marker (legacy compatibility)
  const LEGACY_MARKER = "in_person_scan_completed";

  // If already unlocked under EITHER marker, do nothing
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("id, event_type")
    .eq("user_id", ownerUserId)
    .eq("reference", reference)
    .in("event_type", [NEW_MARKER, LEGACY_MARKER])
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.error("admin-force-unlock existing check failed:", existingErr);
    res.status(500).json({ error: "LEDGER_CHECK_FAILED" });
    return;
  }

  if (existing) {
    res.status(200).json({
      success: true,
      alreadyUnlocked: true,
      marker: (existing as any).event_type,
    });
    return;
  }

  // Read current credits for balance_after
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", ownerUserId)
    .single();

  if (profileErr) {
    console.error("admin-force-unlock profile read failed:", profileErr);
    res.status(500).json({ error: "PROFILE_READ_FAILED" });
    return;
  }

  const currentCredits = Math.max(0, Number((profile as any).credits ?? 0));

  // Insert unlock marker ledger row (no credit spend)
  const { error: insertErr } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: ownerUserId,
    event_type: NEW_MARKER,
    credits_delta: 0,
    balance_after: currentCredits,
    reference,
  });

  if (insertErr) {
    console.error("admin-force-unlock ledger insert failed:", insertErr);
    res.status(500).json({ error: "LEDGER_INSERT_FAILED" });
    return;
  }

  res.status(200).json({
    success: true,
    alreadyUnlocked: false,
    scanId: cleanScanId,
    userId: ownerUserId,
    marker: NEW_MARKER,
  });
}
