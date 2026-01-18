// src/pages/Admin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

type LedgerRow = {
  id: string;
  event_type: string;
  credits_delta: number;
  balance_after: number;
  reference: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string | null;
  credits: number | null;
  created_at?: string;
  updated_at?: string;
};

type AccessRow = {
  id: string;
  email: string;
  plan: string | null;
  scans_remaining: number | null;
  unlimited: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type LookupResponse = {
  profile: ProfileRow;
  ledger: LedgerRow[];
  access: AccessRow | null;
};

function normaliseEmail(email: string | null | undefined) {
  return String(email ?? "").trim().toLowerCase();
}

function isAdminEmail(email: string | null | undefined) {
  return normaliseEmail(email) === normaliseEmail(ADMIN_EMAIL);
}

function formatCredits(n: number | null | undefined) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  return String(Math.max(0, Math.floor(n)));
}

function prettyEventType(s: string) {
  return String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDelta(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe > 0 ? "+" : ""}${safe}`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return "—";
  }
}

export default function Admin() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [targetEmail, setTargetEmail] = useState("");
  const cleanTargetEmail = useMemo(
    () => targetEmail.trim().toLowerCase(),
    [targetEmail]
  );

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookup, setLookup] = useState<LookupResponse | null>(null);

  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState("");

  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [whitelistWorking, setWhitelistWorking] = useState(false);

  const [refundWorking, setRefundWorking] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const [forceUnlockWorking, setForceUnlockWorking] = useState(false);
  const [forceScanId, setForceScanId] = useState("");
  const [forceReason, setForceReason] = useState("");

  useEffect(() => {
    async function guard() {
      setChecking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/sign-in", { replace: true });
        return;
      }

      if (!isAdminEmail(user.email)) {
        navigate("/account", { replace: true });
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    guard();
  }, [navigate]);

  async function getJwtOrThrow(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const jwt = data.session?.access_token ?? null;

    if (!jwt) throw new Error("NOT_AUTHENTICATED");
    return jwt;
  }

  async function handleLookup() {
    setMsg(null);
    setLookup(null);

    if (!cleanTargetEmail) {
      setMsg("Enter an email to look up.");
      return;
    }

    setLookupLoading(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-user-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ email: cleanTargetEmail }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "LOOKUP_FAILED";

        if (code === "NOT_AUTHENTICATED") {
          navigate("/sign-in");
          return;
        }

        if (code === "NOT_AUTHORIZED") {
          navigate("/account");
          return;
        }

        if (code === "USER_NOT_FOUND") {
          setMsg("No user found with that email (profiles table).");
          return;
        }

        setMsg("Lookup failed. Please try again.");
        return;
      }

      setLookup(data as LookupResponse);
      setMsg(null);
    } catch (err) {
      console.error("[Admin] lookup error:", err);
      setMsg("Lookup failed. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAdjustCredits() {
    setMsg(null);

    if (!cleanTargetEmail) {
      setMsg("Enter an email address first.");
      return;
    }

    const n = parseInt(delta, 10);

    if (!Number.isFinite(n) || n === 0) {
      setMsg("Enter a non-zero number (e.g. +5 or -1).");
      return;
    }

    setWorking(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-adjust-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          email: cleanTargetEmail,
          delta: n,
          reason: reason.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "CREDITS_UPDATE_FAILED";

        if (code === "DELTA_TOO_LARGE") {
          setMsg("Delta too large. Keep it within ±1000.");
          return;
        }

        if (code === "USER_NOT_FOUND") {
          setMsg("No user found with that email.");
          return;
        }

        if (code === "NOT_AUTHENTICATED") {
          navigate("/sign-in");
          return;
        }

        if (code === "NOT_AUTHORIZED") {
          navigate("/account");
          return;
        }

        setMsg("Credit update failed. Please try again.");
        return;
      }

      setMsg(
        `Credits updated: ${formatCredits(data?.previousCredits)} → ${formatCredits(
          data?.newCredits
        )}`
      );

      await handleLookup();
    } catch (err) {
      console.error("[Admin] adjust credits error:", err);
      setMsg("Credit update failed. Please try again.");
    } finally {
      setWorking(false);
    }
  }

  async function handleToggleWhitelist(next: boolean) {
    setMsg(null);

    if (!cleanTargetEmail) {
      setMsg("Enter an email address first.");
      return;
    }

    setWhitelistWorking(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          email: cleanTargetEmail,
          whitelisted: next,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "WHITELIST_UPDATE_FAILED";

        if (code === "NOT_AUTHENTICATED") {
          navigate("/sign-in");
          return;
        }

        if (code === "NOT_AUTHORIZED") {
          navigate("/account");
          return;
        }

        setMsg("Whitelist update failed. Please try again.");
        return;
      }

      setMsg(next ? "Whitelist enabled (free unlock)." : "Whitelist removed.");
      await handleLookup();
    } catch (err) {
      console.error("[Admin] whitelist error:", err);
      setMsg("Whitelist update failed. Please try again.");
    } finally {
      setWhitelistWorking(false);
    }
  }

  async function handleRefundLastUnlock() {
    setMsg(null);

    if (!cleanTargetEmail) {
      setMsg("Enter an email address first.");
      return;
    }

    setRefundWorking(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-refund-last-unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          email: cleanTargetEmail,
          reason: refundReason.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "REFUND_FAILED";

        if (code === "NOT_AUTHENTICATED") {
          navigate("/sign-in");
          return;
        }

        if (code === "FORBIDDEN" || code === "NOT_AUTHORIZED") {
          navigate("/account");
          return;
        }

        if (code === "USER_NOT_FOUND") {
          setMsg("No user found with that email.");
          return;
        }

        if (code === "NO_UNLOCKS_TO_REFUND") {
          setMsg("No in-person unlocks found to refund for this user.");
          return;
        }

        if (code === "ALREADY_REFUNDED") {
          setMsg("That last unlock has already been refunded.");
          return;
        }

        setMsg("Refund failed. Please try again.");
        return;
      }

      setMsg(
        `Refunded last unlock (+1 credit). Credits: ${formatCredits(
          data?.credits_before
        )} → ${formatCredits(data?.credits_after)}`
      );

      await handleLookup();
    } catch (err) {
      console.error("[Admin] refund last unlock error:", err);
      setMsg("Refund failed. Please try again.");
    } finally {
      setRefundWorking(false);
    }
  }

  async function handleForceUnlockScan() {
    setMsg(null);

    const scanId = forceScanId.trim();
    if (!scanId) {
      setMsg("Enter a scanId first.");
      return;
    }

    setForceUnlockWorking(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-force-unlock-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          scanId,
          reason: forceReason.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "FORCE_UNLOCK_FAILED";

        if (code === "NOT_AUTHENTICATED") {
          navigate("/sign-in");
          return;
        }

        if (code === "NOT_AUTHORIZED" || code === "FORBIDDEN") {
          navigate("/account");
          return;
        }

        if (code === "SCAN_NOT_FOUND") {
          setMsg("Scan not found. Check the scanId and try again.");
          return;
        }

        setMsg("Force unlock failed. Please try again.");
        return;
      }

      if (data?.alreadyUnlocked) {
        setMsg("That scan is already unlocked (ledger entry already exists).");
        return;
      }

      setMsg("Scan force-unlocked (no credit spend).");
    } catch (err) {
      console.error("[Admin] force unlock error:", err);
      setMsg("Force unlock failed. Please try again.");
    } finally {
      setForceUnlockWorking(false);
    }
  }

  if (checking) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-slate-300">
        Checking access…
      </div>
    );
  }

  if (!allowed) return null;

  const currentCredits = lookup?.profile?.credits ?? null;
  const isWhitelisted = Boolean(lookup?.access?.unlimited);

  const disableAllActions =
    lookupLoading || working || whitelistWorking || refundWorking || forceUnlockWorking;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14 space-y-10">
      <header className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          CarVerity · Admin
        </span>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Admin tools</h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-2">
              Internal controls for support, testing, and credit management.
            </p>
          </div>

          <button
            onClick={() => navigate("/account")}
            className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-4 py-3 transition"
          >
            Back to account
          </button>
        </div>
      </header>

      {msg && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 text-sm text-slate-300">
          {msg}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white">User lookup</h2>
          <p className="text-slate-400 text-sm mt-1">
            Search by email to view credits, whitelist, and ledger history.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              User email
            </label>
            <input
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="user@example.com"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLookup}
              disabled={disableAllActions}
              className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
            >
              {lookupLoading ? "Looking up…" : "Lookup"}
            </button>
          </div>
        </div>

        {lookup && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                  User
                </div>
                <div className="mt-2 text-white font-semibold">
                  {lookup.profile.email ?? "—"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  User ID: {lookup.profile.id}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-4 min-w-[220px]">
                <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                  Credits
                </div>
                <div className="mt-1 text-3xl font-bold text-white tabular-nums">
                  {formatCredits(currentCredits)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Balance from profiles table
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                      Whitelist
                    </div>
                    <div className="mt-2 text-white font-semibold">
                      {isWhitelisted ? "Enabled" : "Not enabled"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Uses user_access.unlimited
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleWhitelist(true)}
                      disabled={whitelistWorking || isWhitelisted || disableAllActions}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-2 transition"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => handleToggleWhitelist(false)}
                      disabled={whitelistWorking || !isWhitelisted || disableAllActions}
                      className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-2 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                    Adjust credits
                  </div>
                  <div className="mt-2 text-slate-300 text-sm">
                    Add or subtract credits (logged to ledger).
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Delta
                    </label>
                    <input
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      inputMode="numeric"
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 5 or -1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      Reason (optional)
                    </label>
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Support top-up"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAdjustCredits}
                  disabled={working || whitelistWorking || lookupLoading || refundWorking || forceUnlockWorking}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
                >
                  {working ? "Applying…" : "Apply credit change"}
                </button>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Tip: use{" "}
                  <span className="text-slate-300 font-semibold">-1</span> to
                  remove a credit, or{" "}
                  <span className="text-slate-300 font-semibold">+5</span> to
                  grant a pack.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                    Refund last unlock
                  </div>
                  <div className="mt-2 text-slate-300 text-sm">
                    Adds <span className="text-slate-200 font-semibold">+1</span>{" "}
                    credit and logs an{" "}
                    <span className="text-slate-200 font-semibold">
                      admin_refund
                    </span>{" "}
                    entry.
                  </div>
                </div>

                <button
                  onClick={handleRefundLastUnlock}
                  disabled={disableAllActions}
                  className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-2 transition"
                >
                  {refundWorking ? "Refunding…" : "Refund last unlock"}
                </button>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Refund reason (optional)
                </label>
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. User paid but app crashed"
                />
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Safety: this action is idempotent per unlock reference (can’t be
                refunded twice).
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                    Force unlock scan (no credit spend)
                  </div>
                  <div className="mt-2 text-slate-300 text-sm">
                    Inserts an unlock marker in{" "}
                    <span className="text-slate-200 font-semibold">
                      credit_ledger
                    </span>{" "}
                    so the scan counts as unlocked.
                  </div>
                </div>

                <button
                  onClick={handleForceUnlockScan}
                  disabled={disableAllActions}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-2 transition"
                >
                  {forceUnlockWorking ? "Unlocking…" : "Force unlock"}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Scan ID
                  </label>
                  <input
                    value={forceScanId}
                    onChange={(e) => setForceScanId(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. inspection_1737... or uuid"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    value={forceReason}
                    onChange={(e) => setForceReason(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Support override"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                This does not change the user’s credit balance.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-semibold">
                    Credit ledger (latest)
                  </div>
                  <div className="text-xs text-slate-500">
                    Last {lookup.ledger.length} events
                  </div>
                </div>
              </div>

              {lookup.ledger.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400">
                  No ledger activity found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-950/40 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-left">Event</th>
                        <th className="px-4 py-3 text-left">Delta</th>
                        <th className="px-4 py-3 text-left">Balance</th>
                        <th className="px-4 py-3 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lookup.ledger.map((row) => (
                        <tr
                          key={row.id}
                          className="border-t border-white/10 text-slate-300"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatDateTime(row.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {prettyEventType(row.event_type)}
                          </td>
                          <td
                            className={[
                              "px-4 py-3 tabular-nums font-semibold",
                              row.credits_delta > 0
                                ? "text-emerald-400"
                                : row.credits_delta < 0
                                ? "text-red-400"
                                : "text-slate-400",
                            ].join(" ")}
                          >
                            {formatDelta(row.credits_delta)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {row.balance_after}
                          </td>
                          <td className="px-4 py-3 text-slate-400">
                            {row.reference || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-xs text-slate-400 leading-relaxed">
              Admin actions are server-protected and require your account
              (jeremy.swallow@gmail.com). Credits are stored in{" "}
              <span className="text-slate-200 font-semibold">profiles.credits</span>{" "}
              and all adjustments are written to{" "}
              <span className="text-slate-200 font-semibold">credit_ledger</span>.
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Premium admin ideas</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
          <li>
            “Refund last unlock” button (adds +1 credit + ledger note, and logs
            the scan reference).
          </li>
          <li>
            “Force unlock scan” by scanId for support cases (no credit spend).
          </li>
          <li>
            Show last scan activity (from scans table) + direct open links.
          </li>
          <li>
            Basic fraud signals: repeated unlock attempts, frequent refunds.
          </li>
        </ul>
      </section>
    </div>
  );
}
