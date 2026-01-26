// src/pages/Admin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Shield,
  User,
  Coins,
  CheckCircle2,
  ArrowLeft,
  RefreshCcw,
  MinusCircle,
  PlusCircle,
  ListOrdered,
  Zap,
  Undo2,
  LockOpen,
  CreditCard,
  Trash2,
  Archive,
  RotateCcw,
  EyeOff,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const ADMIN_EMAIL = "jeremy.swallow@gmail.com";

/* =========================================================
   Types
========================================================= */

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

/* =========================================================
   Scan manager types (UPDATED FOR ARCHIVE/RESTORE VIA RPC)
========================================================= */

type ScanRow = {
  id: string; // uuid PK
  scan_id: string; // text
  plan: string; // text
  scan_type: string; // text
  created_at: string; // timestamptz
  user_id: string; // uuid

  // NEW (recommended)
  archived_at?: string | null; // timestamptz | null
  archived_by?: string | null; // uuid | null
};

/* =========================================================
   Helpers
========================================================= */

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

function isFiniteIntString(s: string) {
  const t = String(s ?? "").trim();
  if (!t) return false;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && String(n) === t.replace(/^\+/, "");
}

function scanMatchesQuery(scan: ScanRow, q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return true;

  const hay = [
    scan.id,
    scan.scan_id,
    scan.user_id,
    scan.plan,
    scan.scan_type,
    scan.archived_at ? "archived" : "active",
  ]
    .join(" ")
    .toLowerCase();

  return hay.includes(t);
}

function isArchived(scan: ScanRow) {
  return Boolean(scan.archived_at);
}

/* =========================================================
   Page
========================================================= */

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

  // Stripe refund tool (credit pack purchase)
  const [stripeRefundWorking, setStripeRefundWorking] = useState(false);
  const [stripeSessionId, setStripeSessionId] = useState("");
  const [stripeRefundReason, setStripeRefundReason] = useState("");

  /* =========================================================
     Scan Manager state
  ========================================================== */

  const [scanQuery, setScanQuery] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [scanErr, setScanErr] = useState<string | null>(null);

  const [scanActionWorkingId, setScanActionWorkingId] = useState<string | null>(
    null
  );

  const [showArchived, setShowArchived] = useState(false);

  const [confirmDeleteScanPkId, setConfirmDeleteScanPkId] = useState<
    string | null
  >(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  const filteredScans = useMemo(() => {
    const q = scanQuery.trim();
    const base = scans.filter((s) => scanMatchesQuery(s, q));
    if (showArchived) return base;
    return base.filter((s) => !isArchived(s));
  }, [scans, scanQuery, showArchived]);

  useEffect(() => {
    async function guard() {
      setChecking(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/signin", { replace: true });
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
          navigate("/signin");
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
          navigate("/signin");
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
          navigate("/signin");
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
          navigate("/signin");
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
          navigate("/signin");
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

  async function handleStripeRefundCreditPack() {
    setMsg(null);

    const sessionId = stripeSessionId.trim();

    if (!sessionId || !sessionId.startsWith("cs_")) {
      setMsg("Enter a valid Stripe Checkout Session ID (starts with cs_).");
      return;
    }

    setStripeRefundWorking(true);

    try {
      const jwt = await getJwtOrThrow();

      const res = await fetch("/api/admin-refund-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          sessionId,
          reason: stripeRefundReason.trim(),
        }),
      });

      const data = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        const code = data?.error || "REFUND_FAILED";

        if (code === "NOT_AUTHENTICATED") {
          navigate("/signin");
          return;
        }

        if (code === "NOT_AUTHORIZED") {
          navigate("/account");
          return;
        }

        if (code === "ALREADY_REFUNDED") {
          setMsg("That Stripe session has already been refunded (blocked).");
          return;
        }

        if (code === "CREDITS_ALREADY_USED") {
          setMsg(
            `Refund blocked: credits from this pack have already been used (current credits: ${formatCredits(
              data?.credits_before
            )}, required available: ${formatCredits(data?.required_available)}).`
          );
          return;
        }

        if (code === "NOT_A_CREDIT_PACK_PURCHASE") {
          setMsg("That Stripe session is not a credit pack purchase.");
          return;
        }

        if (code === "INVALID_PACK") {
          setMsg(
            "Pack metadata was invalid. This purchase can’t be refunded safely."
          );
          return;
        }

        if (code === "NO_PAYMENT_INTENT_TO_REFUND") {
          setMsg("This session has no payment intent to refund.");
          return;
        }

        setMsg("Stripe refund failed. Please try again.");
        return;
      }

      setMsg(
        `Stripe refund complete. Restored ${data?.credits_restored} credits (${formatCredits(
          data?.credits_before
        )} → ${formatCredits(data?.credits_after)}).`
      );

      if (lookup) {
        await handleLookup();
      }
    } catch (err) {
      console.error("[Admin] stripe refund error:", err);
      setMsg("Stripe refund failed. Please try again.");
    } finally {
      setStripeRefundWorking(false);
    }
  }

  async function quickAdjustCredits(n: number, quickReason?: string) {
    if (!cleanTargetEmail) {
      setMsg("Enter an email address first.");
      return;
    }

    setDelta(String(n));
    if (quickReason) setReason(quickReason);

    window.setTimeout(() => {
      handleAdjustCredits();
    }, 50);
  }

  /* =========================================================
     Scan manager actions (ADMIN RPC)
  ========================================================== */

  async function refreshScans() {
    setScanErr(null);
    setScanLoading(true);

    try {
      // IMPORTANT:
      // For "B - all scans for all users", your DB should have:
      // archived_at, archived_by columns
      // + admin RPC functions for archive/restore/delete
      const { data, error } = await supabase
        .from("scans")
        .select(
          "id,scan_id,plan,scan_type,created_at,user_id,archived_at,archived_by"
        )
        .order("created_at", { ascending: false })
        .limit(250);

      if (error) {
        console.warn("[Admin] scans query error:", error);
        setScanErr(
          "Failed to load scans. Ensure scans has archived_at/archived_by columns and admin policies allow SELECT."
        );
        setScans([]);
        return;
      }

      setScans((data as any[]) as ScanRow[]);
    } catch (e) {
      console.warn("[Admin] refreshScans exception:", e);
      setScanErr("Failed to load scans.");
      setScans([]);
    } finally {
      setScanLoading(false);
    }
  }

  useEffect(() => {
    if (!allowed) return;
    refreshScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function archiveScan(pkId: string) {
    setMsg(null);
    setScanErr(null);
    setScanActionWorkingId(pkId);

    try {
      const { error } = await supabase.rpc("admin_archive_scan", {
        p_scan_id: pkId,
      });

      if (error) {
        console.warn("[Admin] archive scan error:", error);
        setScanErr(
          "Archive failed. Confirm the RPC admin_archive_scan exists and you are authorized."
        );
        return;
      }

      setMsg("Scan archived.");
      await refreshScans();
    } finally {
      setScanActionWorkingId(null);
    }
  }

  async function restoreScan(pkId: string) {
    setMsg(null);
    setScanErr(null);
    setScanActionWorkingId(pkId);

    try {
      const { error } = await supabase.rpc("admin_restore_scan", {
        p_scan_id: pkId,
      });

      if (error) {
        console.warn("[Admin] restore scan error:", error);
        setScanErr(
          "Restore failed. Confirm the RPC admin_restore_scan exists and you are authorized."
        );
        return;
      }

      setMsg("Scan restored.");
      await refreshScans();
    } finally {
      setScanActionWorkingId(null);
    }
  }

  async function purgeScan(pkId: string) {
    setMsg(null);
    setScanErr(null);
    setScanActionWorkingId(pkId);

    try {
      const { error } = await supabase.rpc("admin_delete_scan", {
        p_scan_id: pkId,
      });

      if (error) {
        console.warn("[Admin] purge scan error:", error);
        setScanErr(
          "Permanent delete failed. Confirm the RPC admin_delete_scan exists and you are authorized."
        );
        return;
      }

      setMsg("Scan permanently deleted.");
      await refreshScans();
    } finally {
      setScanActionWorkingId(null);
    }
  }

  async function archiveAllScansForUserId(userId: string) {
    const u = String(userId ?? "").trim();
    if (!u) {
      setScanErr("Enter a user_id first.");
      return;
    }

    setMsg(null);
    setScanErr(null);
    setScanLoading(true);

    try {
      // We keep this as a client-side bulk action ONLY IF you have an admin bulk RPC.
      // Otherwise it will be blocked by RLS for other users.
      const { error } = await supabase.rpc("admin_archive_scans_for_user", {
        p_user_id: u,
      });

      if (error) {
        console.warn("[Admin] archive all scans error:", error);
        setScanErr(
          "Bulk archive failed. Create RPC admin_archive_scans_for_user(user_id) or remove this button."
        );
        return;
      }

      setMsg("Archived all active scans for that user.");
      await refreshScans();
    } finally {
      setScanLoading(false);
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
    lookupLoading ||
    working ||
    whitelistWorking ||
    refundWorking ||
    forceUnlockWorking ||
    stripeRefundWorking ||
    scanLoading ||
    Boolean(scanActionWorkingId);

  const totalArchived = scans.filter((s) => isArchived(s)).length;
  const totalActive = scans.length - totalArchived;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8 sm:space-y-10">
      {/* HEADER */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
              CarVerity · Admin
            </span>
          </div>

          <button
            onClick={() => navigate("/account")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 text-slate-200 font-semibold px-3 py-2 sm:px-4 sm:py-3 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to account</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Admin tools
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Internal controls for support, testing, and credit management.
          </p>
        </div>
      </header>

      {msg && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 text-sm text-slate-300">
          {msg}
        </div>
      )}

      {/* USER LOOKUP */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">User lookup</h2>
            <p className="text-slate-400 text-sm mt-1">
              Search by email to view credits, whitelist, and ledger history.
            </p>
          </div>

          <button
            onClick={handleLookup}
            disabled={disableAllActions || !cleanTargetEmail}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              User email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                type="email"
                className="w-full pl-10 rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLookup}
              disabled={disableAllActions}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
            >
              <User className="h-4 w-4" />
              {lookupLoading ? "Looking up…" : "Lookup"}
            </button>
          </div>
        </div>

        {/* RESULTS */}
        {lookup && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:p-5 space-y-4">
            {/* USER + CREDITS */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                  User
                </div>
                <div className="mt-1 text-white font-semibold">
                  {lookup.profile.email ?? "—"}
                </div>
                <div className="text-xs text-slate-500">
                  User ID: {lookup.profile.id}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
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

                  <Coins className="h-7 w-7 text-slate-400" />
                </div>

                {/* MOBILE QUICK BUTTONS */}
                <div className="sm:hidden mt-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
                    Quick credit actions
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        quickAdjustCredits(-1, "Admin quick adjust")
                      }
                      disabled={disableAllActions}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-3 py-3"
                    >
                      <MinusCircle className="h-4 w-4 text-slate-300" />
                      -1
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        quickAdjustCredits(+1, "Admin quick adjust")
                      }
                      disabled={disableAllActions}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-3 py-3"
                    >
                      <PlusCircle className="h-4 w-4" />
                      +1
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        quickAdjustCredits(+5, "Admin quick adjust")
                      }
                      disabled={disableAllActions}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-3 py-3"
                    >
                      <Zap className="h-4 w-4" />
                      +5
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Tip: Use -1 to remove a credit, or +5 to grant a pack.
                  </p>
                </div>
              </div>
            </div>

            {/* WHITELIST + ADJUST CREDITS */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* WHITELIST */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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

                  <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-2">
                    <button
                      onClick={() => handleToggleWhitelist(true)}
                      disabled={
                        whitelistWorking || isWhitelisted || disableAllActions
                      }
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 sm:py-2 transition"
                    >
                      Enable
                    </button>
                    <button
                      onClick={() => handleToggleWhitelist(false)}
                      disabled={
                        whitelistWorking || !isWhitelisted || disableAllActions
                      }
                      className="w-full rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 sm:py-2 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* ADJUST CREDITS */}
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
                <div>
                  <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                    Adjust credits
                  </div>
                  <div className="mt-2 text-slate-300 text-sm">
                    Add or subtract credits (logged to ledger).
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  disabled={disableAllActions}
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

                {!isFiniteIntString(delta) && (
                  <p className="text-xs text-amber-300/90">
                    Delta should be a whole number (e.g. -1, 1, 5).
                  </p>
                )}
              </div>
            </div>

            {/* STRIPE REFUND CREDIT PACK */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                      Refund credit pack purchase (Stripe)
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    Refunds the Stripe payment and restores the pack credits.
                  </div>
                </div>

                <button
                  onClick={handleStripeRefundCreditPack}
                  disabled={disableAllActions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
                >
                  {stripeRefundWorking ? (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Refunding…
                    </>
                  ) : (
                    <>
                      <Undo2 className="h-4 w-4" />
                      Refund purchase
                    </>
                  )}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Stripe Checkout Session ID
                  </label>
                  <input
                    value={stripeSessionId}
                    onChange={(e) => setStripeSessionId(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="cs_test_..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    value={stripeRefundReason}
                    onChange={(e) => setStripeRefundReason(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. User charged twice"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Safety: This action won’t refund the same session twice.
                </p>
              </div>
            </div>

            {/* REFUND LAST UNLOCK */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Undo2 className="h-4 w-4 text-slate-400" />
                    <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                      Refund last unlock
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    Adds{" "}
                    <span className="text-slate-200 font-semibold">+1</span>{" "}
                    credit and logs an admin_refund entry.
                  </div>
                </div>

                <button
                  onClick={handleRefundLastUnlock}
                  disabled={disableAllActions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
                >
                  {refundWorking ? (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Refunding…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Refund last unlock
                    </>
                  )}
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
            </div>

            {/* FORCE UNLOCK */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <LockOpen className="h-4 w-4 text-slate-400" />
                    <div className="text-slate-400 text-xs uppercase tracking-[0.18em]">
                      Force unlock scan (no credit spend)
                    </div>
                  </div>

                  <div className="text-slate-300 text-sm">
                    Inserts an unlock marker in credit_ledger.
                  </div>
                </div>

                <button
                  onClick={handleForceUnlockScan}
                  disabled={disableAllActions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-4 py-3 transition"
                >
                  {forceUnlockWorking ? (
                    <>
                      <RefreshCcw className="h-4 w-4" />
                      Unlocking…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Force unlock
                    </>
                  )}
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
            </div>

            {/* LEDGER */}
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-slate-200 font-semibold">
                      Credit ledger (latest)
                    </div>
                    <div className="text-xs text-slate-500">
                      Last {lookup.ledger.length} events
                    </div>
                  </div>
                </div>
              </div>

              {lookup.ledger.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400">
                  No ledger activity found.
                </div>
              ) : (
                <>
                  <div className="sm:hidden px-4 py-4 space-y-3">
                    {lookup.ledger.map((row) => {
                      const deltaTone =
                        row.credits_delta > 0
                          ? "text-emerald-300"
                          : row.credits_delta < 0
                          ? "text-red-300"
                          : "text-slate-300";

                      return (
                        <div
                          key={row.id}
                          className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="text-slate-200 font-semibold text-sm">
                                {prettyEventType(row.event_type)}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatDateTime(row.created_at)}
                              </div>
                            </div>

                            <div className="text-right">
                              <div
                                className={[
                                  "text-sm font-semibold tabular-nums",
                                  deltaTone,
                                ].join(" ")}
                              >
                                {formatDelta(row.credits_delta)}
                              </div>
                              <div className="text-xs text-slate-500 tabular-nums">
                                Bal: {row.balance_after}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-slate-500">
                            <span className="text-slate-400">Ref:</span>{" "}
                            {row.reference || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden sm:block overflow-x-auto">
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
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4 text-xs text-slate-400 leading-relaxed">
              Admin actions are server-protected and require your account
              (jeremy.swallow@gmail.com). Credits are stored in{" "}
              <span className="text-slate-200 font-semibold">
                profiles.credits
              </span>{" "}
              and all adjustments are written to{" "}
              <span className="text-slate-200 font-semibold">credit_ledger</span>
              .
            </div>
          </div>
        )}
      </section>

      {/* SCAN MANAGER */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Scan manager</h2>
            <p className="text-slate-400 text-sm mt-1">
              Archive, restore, or permanently delete saved scans.
            </p>
          </div>

          <button
            onClick={refreshScans}
            disabled={disableAllActions}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
          >
            <RefreshCcw className="h-4 w-4" />
            {scanLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {scanErr && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
            {scanErr}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Search scans
            </label>
            <input
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="scan_id, user_id, plan, type…"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              disabled={disableAllActions}
              className={[
                "w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition",
              ].join(" ")}
            >
              {showArchived ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide archived
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show archived
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bulk archive is only safe via RPC */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Bulk actions require an RPC
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Because this Admin manages scans across all users, archive /
                restore / delete must run via database RPC functions (admin-only)
                with RLS enabled.
              </p>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={() => archiveAllScansForUserId(lookup?.profile?.id ?? "")}
              disabled={disableAllActions || !lookup?.profile?.id}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-4 py-3 transition"
            >
              <Archive className="h-4 w-4" />
              Archive all scans for looked-up user
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="text-slate-200 font-semibold">Latest scans</div>
            <div className="text-xs text-slate-500">
              Showing {filteredScans.length} of {scans.length} · Active{" "}
              {totalActive} · Archived {totalArchived}
            </div>
          </div>

          {filteredScans.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-400">
              No scans found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/40 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">scan_id</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((s) => {
                    const archived = isArchived(s);
                    const busy = scanActionWorkingId === s.id;

                    return (
                      <tr
                        key={s.id}
                        className="border-t border-white/10 text-slate-300 align-top"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {s.scan_id}
                          <div className="text-[10px] text-slate-500 mt-1">
                            pk: {s.id}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-200">
                          {s.scan_type}
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-200">
                          {s.plan}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          <div className="text-slate-200 font-mono">
                            {s.user_id}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {formatDateTime(s.created_at)}
                        </td>

                        <td className="px-4 py-3 text-xs">
                          {archived ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-amber-200">
                              <Archive className="h-3.5 w-3.5" />
                              Archived
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {!archived ? (
                              <button
                                onClick={() => archiveScan(s.id)}
                                disabled={disableAllActions || busy}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-950/40 hover:bg-slate-900 disabled:opacity-60 text-slate-200 font-semibold px-3 py-2"
                              >
                                <Archive className="h-4 w-4" />
                                Archive
                              </button>
                            ) : (
                              <button
                                onClick={() => restoreScan(s.id)}
                                disabled={disableAllActions || busy}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold px-3 py-2"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restore
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setConfirmDeleteScanPkId(s.id);
                                setConfirmDeleteText("");
                              }}
                              disabled={disableAllActions || busy}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 hover:bg-red-500/15 disabled:opacity-60 text-red-200 font-semibold px-3 py-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirm permanent delete */}
        {confirmDeleteScanPkId && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-100">
                  Permanently delete scan
                </p>
                <p className="text-xs text-red-200/80 mt-1">
                  This cannot be undone. Type <strong>DELETE</strong> to confirm.
                </p>
              </div>

              <button
                onClick={() => {
                  setConfirmDeleteScanPkId(null);
                  setConfirmDeleteText("");
                }}
                className="text-xs text-red-200 underline"
              >
                Cancel
              </button>
            </div>

            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <input
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-red-400/30 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type DELETE"
              />

              <button
                onClick={async () => {
                  if (confirmDeleteText.trim() !== "DELETE") return;
                  const id = confirmDeleteScanPkId;
                  setConfirmDeleteScanPkId(null);
                  setConfirmDeleteText("");
                  await purgeScan(id);
                }}
                disabled={
                  disableAllActions || confirmDeleteText.trim() !== "DELETE"
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-black font-semibold px-4 py-3"
              >
                <Trash2 className="h-4 w-4" />
                Delete forever
              </button>
            </div>
          </div>
        )}
      </section>

      {/* IDEAS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">Premium admin ideas</h2>
        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1.5">
          <li>
            Refund credit pack purchase by Stripe Checkout Session ID (money back
            + credit restore).
          </li>
          <li>Refund last unlock for in-person report generation failures.</li>
          <li>Force unlock scan by scanId for support cases (no credit spend).</li>
          <li>Basic fraud signals: repeated unlock attempts, frequent refunds.</li>
          <li>Scan manager: archive/restore/purge scans.</li>
        </ul>
      </section>
    </div>
  );
}
