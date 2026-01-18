// api/admin-user-lookup.ts
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

  const { email } = req.body ?? {};
  const targetEmail = normaliseEmail(email || "");

  if (!targetEmail) {
    res.status(400).json({ error: "MISSING_EMAIL" });
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Find user by email in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, credits, created_at, updated_at")
      .eq("email", targetEmail)
      .maybeSingle();

    if (profileError) {
      console.error("[admin-user-lookup] profileError:", profileError);
      res.status(500).json({ error: "LOOKUP_FAILED" });
      return;
    }

    if (!profile) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }

    // Pull last 50 ledger rows
    const { data: ledger, error: ledgerError } = await supabaseAdmin
      .from("credit_ledger")
      .select("id, event_type, credits_delta, balance_after, reference, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ledgerError) {
      console.error("[admin-user-lookup] ledgerError:", ledgerError);
      res.status(500).json({ error: "LEDGER_LOOKUP_FAILED" });
      return;
    }

    // Pull user_access row (whitelist info)
    const { data: access, error: accessError } = await supabaseAdmin
      .from("user_access")
      .select(
        "id, email, plan, scans_remaining, unlimited, stripe_customer_id, stripe_subscription_id"
      )
      .eq("email", targetEmail)
      .maybeSingle();

    if (accessError) {
      console.error("[admin-user-lookup] accessError:", accessError);
      res.status(500).json({ error: "ACCESS_LOOKUP_FAILED" });
      return;
    }

    res.status(200).json({
      profile,
      ledger: ledger ?? [],
      access: access ?? null,
    });
  } catch (err) {
    console.error("[admin-user-lookup] unexpected:", err);
    res.status(500).json({ error: "LOOKUP_FAILED" });
  }
}
