import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

function cleanEmail(email: string) {
  return email.trim().toLowerCase();
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

  // User client (to identify the caller)
  const supabaseUser = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || "", {
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

  const callerEmail = cleanEmail(user.email || "");
  if (callerEmail !== ADMIN_EMAIL) {
    res.status(403).json({ error: "FORBIDDEN" });
    return;
  }

  const { email, reason } = req.body ?? {};
  const targetEmail = cleanEmail(String(email || ""));

  if (!targetEmail) {
    res.status(400).json({ error: "MISSING_EMAIL" });
    return;
  }

  // Admin client (service role)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Find user by email in profiles
  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, credits")
    .eq("email", targetEmail)
    .maybeSingle();

  if (profileErr) {
    console.error("admin-refund profile lookup failed:", profileErr);
    res.status(500).json({ error: "PROFILE_LOOKUP_FAILED" });
    return;
  }

  if (!profile) {
    res.status(404).json({ error: "USER_NOT_FOUND" });
    return;
  }

  const userId = profile.id;

  // Find most recent in_person_scan_completed entry for this user
  const { data: lastUnlock, error: unlockErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("id, reference, created_at")
    .eq("user_id", userId)
    .eq("event_type", "in_person_scan_completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (unlockErr) {
    console.error("admin-refund ledger lookup failed:", unlockErr);
    res.status(500).json({ error: "LEDGER_LOOKUP_FAILED" });
    return;
  }

  if (!lastUnlock) {
    res.status(400).json({ error: "NO_UNLOCKS_TO_REFUND" });
    return;
  }

  // Prevent double-refund of the same unlock reference
  const refundReference = `refund:${lastUnlock.reference}`;

  const { data: existingRefund, error: existingRefundErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "admin_refund")
    .eq("reference", refundReference)
    .limit(1)
    .maybeSingle();

  if (existingRefundErr) {
    console.error("admin-refund existing refund check failed:", existingRefundErr);
    res.status(500).json({ error: "REFUND_CHECK_FAILED" });
    return;
  }

  if (existingRefund) {
    res.status(409).json({ error: "ALREADY_REFUNDED" });
    return;
  }

  // Get current credits (fresh)
  const { data: freshProfile, error: freshErr } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (freshErr) {
    console.error("admin-refund fresh profile read failed:", freshErr);
    res.status(500).json({ error: "PROFILE_READ_FAILED" });
    return;
  }

  const currentCredits = Math.max(0, Number(freshProfile.credits ?? 0));
  const nextCredits = currentCredits + 1;

  // Update credits
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({ credits: nextCredits })
    .eq("id", userId);

  if (updateErr) {
    console.error("admin-refund profile update failed:", updateErr);
    res.status(500).json({ error: "CREDITS_UPDATE_FAILED" });
    return;
  }

  // Insert ledger entry
  const ledgerReason = String(reason || "").trim();
  const referenceWithReason = ledgerReason
    ? `${refundReference} | ${ledgerReason}`
    : refundReference;

  const { error: insertErr } = await supabaseAdmin.from("credit_ledger").insert({
    user_id: userId,
    event_type: "admin_refund",
    credits_delta: 1,
    balance_after: nextCredits,
    reference: referenceWithReason,
  });

  if (insertErr) {
    console.error("admin-refund ledger insert failed:", insertErr);
    res.status(500).json({ error: "LEDGER_INSERT_FAILED" });
    return;
  }

  res.status(200).json({
    success: true,
    refunded_reference: lastUnlock.reference,
    credits_before: currentCredits,
    credits_after: nextCredits,
  });
}
