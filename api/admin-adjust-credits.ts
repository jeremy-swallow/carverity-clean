// api/admin-adjust-credits.ts
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

function normaliseEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function getJwt(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const jwt = authHeader.replace("Bearer ", "").trim();
  return jwt || null;
}

async function requireAdminEmail(jwt: string): Promise<void> {
  const supabaseAsUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: { persistSession: false },
  });

  const { data, error } = await supabaseAsUser.auth.getUser();

  if (error || !data?.user) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const email = normaliseEmail(data.user.email || "");
  if (email !== normaliseEmail(ADMIN_EMAIL)) {
    throw new Error("NOT_AUTHORIZED");
  }
}

function safeInt(n: any): number | null {
  const v = typeof n === "string" ? parseInt(n, 10) : n;
  if (!Number.isFinite(v)) return null;
  return Math.trunc(v);
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

  try {
    await requireAdminEmail(jwt);
  } catch (e) {
    const code = (e as any)?.message || "NOT_AUTHORIZED";

    if (code === "NOT_AUTHENTICATED") {
      res.status(401).json({ error: "NOT_AUTHENTICATED" });
      return;
    }

    res.status(403).json({ error: "NOT_AUTHORIZED" });
    return;
  }

  const { email, delta, reason } = req.body ?? {};
  const targetEmail = normaliseEmail(email || "");
  const deltaInt = safeInt(delta);

  if (!targetEmail) {
    res.status(400).json({ error: "MISSING_EMAIL" });
    return;
  }

  if (deltaInt === null || deltaInt === 0) {
    res.status(400).json({ error: "INVALID_DELTA" });
    return;
  }

  // Safety clamp: avoid accidental huge changes
  if (Math.abs(deltaInt) > 1000) {
    res.status(400).json({ error: "DELTA_TOO_LARGE" });
    return;
  }

  const safeReason = String(reason || "").trim().slice(0, 140);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Find profile by email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, credits")
      .eq("email", targetEmail)
      .maybeSingle();

    if (profileError) {
      console.error("[admin-adjust-credits] profileError:", profileError);
      res.status(500).json({ error: "PROFILE_LOOKUP_FAILED" });
      return;
    }

    if (!profile) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }

    const currentCredits = typeof profile.credits === "number" ? profile.credits : 0;
    const nextCredits = Math.max(0, currentCredits + deltaInt);

    // Update profile credits
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ credits: nextCredits })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[admin-adjust-credits] updateError:", updateError);
      res.status(500).json({ error: "CREDITS_UPDATE_FAILED" });
      return;
    }

    // Insert ledger event (admin adjustment)
    const reference = safeReason
      ? `admin:${safeReason}`
      : "admin:manual_adjustment";

    const { error: ledgerError } = await supabaseAdmin.from("credit_ledger").insert({
      user_id: profile.id,
      event_type: "admin_adjustment",
      credits_delta: deltaInt,
      balance_after: nextCredits,
      reference,
    });

    if (ledgerError) {
      console.error("[admin-adjust-credits] ledgerError:", ledgerError);
      // We still updated credits, so return success but warn
      res.status(200).json({
        ok: true,
        userId: profile.id,
        email: profile.email,
        previousCredits: currentCredits,
        newCredits: nextCredits,
        warning: "LEDGER_INSERT_FAILED",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      userId: profile.id,
      email: profile.email,
      previousCredits: currentCredits,
      newCredits: nextCredits,
    });
  } catch (err) {
    console.error("[admin-adjust-credits] unexpected:", err);
    res.status(500).json({ error: "CREDITS_UPDATE_FAILED" });
  }
}
