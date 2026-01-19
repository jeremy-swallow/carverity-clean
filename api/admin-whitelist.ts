import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!SUPABASE_ANON_KEY) throw new Error("Missing VITE_SUPABASE_ANON_KEY");
if (!SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

function normaliseEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

function getJwt(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const jwt = authHeader.replace("Bearer ", "").trim();
  return jwt || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const jwt = getJwt(req);
  if (!jwt) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  /* -------------------------------------------------
     Identify caller (must be admin)
  -------------------------------------------------- */

  const supabaseAsUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: userErr,
  } = await supabaseAsUser.auth.getUser();

  if (userErr || !user) {
    res.status(401).json({ error: "NOT_AUTHENTICATED" });
    return;
  }

  if (normaliseEmail(user.email) !== normaliseEmail(ADMIN_EMAIL)) {
    res.status(403).json({ error: "NOT_AUTHORIZED" });
    return;
  }

  /* -------------------------------------------------
     Validate input
  -------------------------------------------------- */

  const { email, whitelisted } = req.body ?? {};
  const targetEmail = normaliseEmail(email);

  if (!targetEmail) {
    res.status(400).json({ error: "MISSING_EMAIL" });
    return;
  }

  const allow = Boolean(whitelisted);

  /* -------------------------------------------------
     Service role client (authoritative writes)
  -------------------------------------------------- */

  const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  /* -------------------------------------------------
     Resolve user by profiles table
  -------------------------------------------------- */

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("email", targetEmail)
    .maybeSingle();

  if (profileErr) {
    console.error("[admin-whitelist] profile lookup failed:", profileErr);
    res.status(500).json({ error: "PROFILE_LOOKUP_FAILED" });
    return;
  }

  if (!profile) {
    res.status(404).json({ error: "USER_NOT_FOUND" });
    return;
  }

  /* -------------------------------------------------
     Upsert whitelist access by user_id (NOT email)
  -------------------------------------------------- */

  const { data: access, error: accessErr } = await supabaseAdmin
    .from("user_access")
    .upsert(
      {
        user_id: profile.id,
        email: targetEmail,
        unlimited: allow,
        plan: allow ? "whitelist" : "free",
      },
      { onConflict: "user_id" }
    )
    .select("id, user_id, email, plan, unlimited")
    .single();

  if (accessErr) {
    console.error("[admin-whitelist] upsert failed:", accessErr);
    res.status(500).json({ error: "WHITELIST_UPDATE_FAILED" });
    return;
  }

  res.status(200).json({
    success: true,
    access,
  });
}
