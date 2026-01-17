// src/pages/Admin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type ProfileRow = {
  id: string;
  email: string | null;
  credits: number | null;
};

const ADMIN_EMAIL_ALLOWLIST = [
  "carverity.au@outlook.com",
  "jeremy_swallow@outlook.com",
];

function normaliseEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

function isAdminEmail(email: string | null | undefined) {
  const e = normaliseEmail(email);
  if (!e) return false;
  return ADMIN_EMAIL_ALLOWLIST.includes(e);
}

function safeInt(n: any): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.floor(v);
}

export default function Admin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ProfileRow[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ProfileRow | null>(null);

  const [addCredits, setAddCredits] = useState<string>("5");
  const [applying, setApplying] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const canUseAdmin = useMemo(() => isAdminEmail(meEmail), [meEmail]);

  useEffect(() => {
    async function boot() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in", { replace: true });
        return;
      }

      const email = normaliseEmail(user.email);
      setMeEmail(email || null);

      if (!isAdminEmail(email)) {
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    boot();
  }, [navigate]);

  async function runSearch() {
    setSearchError(null);
    setActionMsg(null);
    setSelected(null);

    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    setSearching(true);

    try {
      // IMPORTANT:
      // This assumes your RLS allows a signed-in admin to read profiles.
      // If RLS blocks it (likely), we’ll replace this with an admin-only API route.
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, credits")
        .ilike("email", `%${q}%`)
        .order("email", { ascending: true })
        .limit(20);

      if (error) {
        console.error("[Admin] Search error:", error);
        setSearchError(
          "Could not search users (likely blocked by permissions)."
        );
        setResults([]);
        return;
      }

      setResults((data as ProfileRow[]) ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function refreshSelected(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, credits")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Admin] Refresh selected error:", error);
      return;
    }

    setSelected(data as ProfileRow);
  }

  async function applyCreditGrant() {
    if (!selected) return;

    setActionMsg(null);

    const delta = safeInt(addCredits);
    if (delta <= 0) {
      setActionMsg("Enter a positive number of credits to add.");
      return;
    }

    setApplying(true);

    try {
      // IMPORTANT:
      // This assumes you allow admin to update profiles credits.
      // If RLS blocks it (likely), we’ll move this to a server API route.
      const current = safeInt(selected.credits);
      const next = current + delta;

      const { error } = await supabase
        .from("profiles")
        .update({ credits: next })
        .eq("id", selected.id);

      if (error) {
        console.error("[Admin] Credit update error:", error);
        setActionMsg("Could not update credits (permissions blocked).");
        return;
      }

      setActionMsg(`Added ${delta} credits.`);
      await refreshSelected(selected.id);
      await runSearch();
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-slate-300">
        Loading admin…
      </div>
    );
  }

  if (!canUseAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <h1 className="text-2xl font-semibold text-white">Admin</h1>
        <p className="text-slate-400 text-sm">
          You don’t have access to this page.
        </p>

        <button
          onClick={() => navigate("/account")}
          className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-4 py-3 transition"
        >
          Back to account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            CarVerity · Admin
          </span>
          <h1 className="text-3xl font-semibold mt-2">Admin tools</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Search users by email and grant credits for testing.
          </p>
        </div>

        <button
          onClick={() => navigate("/account")}
          className="px-4 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 text-sm font-semibold"
        >
          Back to account
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Find a user</h2>
          <p className="text-slate-400 text-sm mt-1">
            Type part of an email address to search.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="example@gmail.com"
            className="flex-1 rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            onClick={runSearch}
            disabled={searching}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {searchError && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
            {searchError}
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Credits</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/10 text-slate-200"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {r.email ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">{r.id}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {safeInt(r.credits)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelected(r);
                          setActionMsg(null);
                        }}
                        className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-3 py-2 transition"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && query.trim() && !searching && !searchError && (
          <p className="text-slate-500 text-sm">No users found.</p>
        )}
      </div>

      {/* Selected user */}
      {selected && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Manage user</h2>
            <p className="text-slate-400 text-sm mt-1">
              {selected.email ?? "—"}
            </p>
            <p className="text-slate-500 text-xs mt-1">{selected.id}</p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Current credits
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {safeInt(selected.credits)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={addCredits}
                onChange={(e) => setAddCredits(e.target.value)}
                className="w-24 rounded-xl bg-slate-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                inputMode="numeric"
              />
              <button
                onClick={applyCreditGrant}
                disabled={applying}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-2 transition"
              >
                {applying ? "Applying…" : "Add credits"}
              </button>
            </div>
          </div>

          {actionMsg && (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-200 text-sm">
              {actionMsg}
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            Note: This is an early admin tool for testing only. We’ll harden
            permissions and ledger logging next.
          </p>
        </div>
      )}
    </div>
  );
}
