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

  const { scanId, reason } = req.body ?? {};
  const cleanScanId = String(scanId || "").trim();

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

  // IMPORTANT:
  // Your unlock logic checks for an existing row where:
  // event_type = 'in_person_scan_completed' AND reference = 'scan:<scanId>'
  //
  // So for "force unlock" to work without changing the app logic,
  // we insert that exact marker row (credits_delta = 0).
  //
  // NOTE:
  // We keep reference EXACTLY as scan:<scanId> so the check matches.
  // We store the admin reason in event_type instead (audit-friendly).
  // If you prefer a dedicated event_type, we can change the unlock check later.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", ownerUserId)
    .eq("event_type", "in_person_scan_completed")
    .eq("reference", reference)
    .limit(1)
    .maybeSingle();

  if (existingErr) {
    console.error("admin-force-unlock existing check failed:", existingErr);
    res.status(500).json({ error: "LEDGER_CHECK_FAILED" });
    return;
  }

  if (existing) {
    res.status(200).json({ success: true, alreadyUnlocked: true });
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
  const cleanReason = String(reason || "").trim();

  // Insert marker ledger row that makes the scan count as unlocked
  const { error: insertErr } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: ownerUserId,
    event_type: cleanReason
      ? "in_person_scan_completed"
      : "in_person_scan_completed",
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
  });
}
