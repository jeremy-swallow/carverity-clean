// api/start-in-person-scan.ts

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL)");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type RpcResult = {
  ok: boolean;
  new_balance: number;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate Supabase user from the access token (server-side)
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // IMPORTANT:
    // The RPC uses auth.uid(), so we must call it with a client that carries the user's JWT.
    // We create a short-lived Supabase client that uses the user's token for this request.
    const supabaseAsUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error } = await supabaseAsUser.rpc(
      "deduct_credit_for_in_person_scan"
    );

    if (error) {
      console.error("RPC error:", error);
      return res.status(500).json({ error: "Failed to start scan" });
    }

    const row = Array.isArray(data) ? (data[0] as RpcResult) : (data as RpcResult);

    if (!row?.ok) {
      return res.status(402).json({
        error: "No credits",
        code: "NO_CREDITS",
        newBalance: row?.new_balance ?? 0,
      });
    }

    return res.status(200).json({
      ok: true,
      newBalance: row.new_balance,
    });
  } catch (err) {
    console.error("start-in-person-scan error:", err);
    return res.status(500).json({ error: "Failed to start scan" });
  }
}
