// api/admin-whitelist.ts
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

  const { email, whitelisted } = req.body ?? {};
  const targetEmail = normaliseEmail(email || "");

  if (!targetEmail) {
    res.status(400).json({ error: "MISSING_EMAIL" });
    return;
  }

  const allow = Boolean(whitelisted);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    // Upsert into user_access
    const { data, error } = await supabaseAdmin
      .from("user_access")
      .upsert(
        {
          email: targetEmail,
          unlimited: allow,
          plan: allow ? "whitelist" : "free",
        },
        { onConflict: "email" }
      )
      .select("id, email, plan, scans_remaining, unlimited")
      .single();

    if (error) {
      console.error("[admin-whitelist] upsert error:", error);
      res.status(500).json({ error: "WHITELIST_UPDATE_FAILED" });
      return;
    }

    res.status(200).json({
      ok: true,
      access: data,
    });
  } catch (err) {
    console.error("[admin-whitelist] unexpected:", err);
    res.status(500).json({ error: "WHITELIST_UPDATE_FAILED" });
  }
}
