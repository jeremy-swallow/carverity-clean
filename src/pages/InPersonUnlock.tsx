// src/pages/InPersonUnlock.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

function formatCredits(n: number | null) {
  if (n == null) return "—";
  return String(Math.max(0, Math.floor(n)));
}

export default function InPersonUnlock() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId?: string }>();

  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  async function refreshCredits() {
    setLoadingCredits(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;

      if (!session) {
        setCredits(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.warn("[Unlock] Failed to fetch credits:", profileError);
        setCredits(null);
        return;
      }

      setCredits(typeof profile?.credits === "number" ? profile.credits : 0);
    } finally {
      setLoadingCredits(false);
    }
  }

  useEffect(() => {
    refreshCredits();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshCredits();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlockReport() {
    if (!scanId || unlocking) return;

    setUnlocking(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUnlocking(false);
      navigate("/sign-in");
      return;
    }

    const safeCredits = typeof credits === "number" ? credits : 0;

    // Fast client-side gate (nice UX)
    if (!loadingCredits && safeCredits <= 0) {
      setUnlocking(false);
      navigate(`/pricing?reason=no_credits&scanId=${encodeURIComponent(scanId)}`);
      return;
    }

    try {
      const res = await fetch("/api/mark-in-person-scan-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanId }),
      });

      // If server says NO_CREDITS, route to pricing
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const serverError = data?.error as string | undefined;

        console.error("[Unlock] API error:", data);

        if (res.status === 402 || serverError === "NO_CREDITS") {
          setUnlocking(false);
          navigate(
            `/pricing?reason=no_credits&scanId=${encodeURIComponent(scanId)}`
          );
          return;
        }

        if (res.status === 401 || serverError === "NOT_AUTHENTICATED") {
          setUnlocking(false);
          navigate("/sign-in");
          return;
        }

        throw new Error("FAILED_TO_UNLOCK");
      }

      // Go directly to the full paid report (no preview)
      navigate(`/scan/in-person/results/${scanId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong unlocking the report.");
      setUnlocking(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
        CarVerity · Report unlock
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Unlock full report
      </h1>

      <p className="text-slate-300 text-sm max-w-2xl">
        Your inspection is complete. Unlocking uses{" "}
        <span className="text-white font-semibold">1 credit</span> and reveals
        the full report instantly.
      </p>

      <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Credits
        </p>

        <p className="text-sm text-slate-300">
          Available:{" "}
          <span className="text-white font-semibold tabular-nums">
            {loadingCredits ? "…" : formatCredits(credits)}
          </span>
        </p>

        {!loadingCredits && (credits ?? 0) <= 0 && (
          <p className="text-xs text-slate-500">
            You don’t have any credits available. Buy credits to unlock this
            report.
          </p>
        )}
      </div>

      {!scanId && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-900/30 px-4 py-3 text-amber-200 text-sm">
          Missing scan ID. Please return to your scan and try again.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={unlockReport}
        disabled={unlocking || !scanId || loadingCredits}
        className={[
          "w-full rounded-xl px-4 py-3 font-semibold shadow transition",
          unlocking || !scanId || loadingCredits
            ? "bg-emerald-500/60 text-black/70 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {unlocking ? "Unlocking…" : "Unlock report (uses 1 credit)"}
      </button>

      {!loadingCredits && (credits ?? 0) <= 0 && (
        <button
          onClick={() =>
            scanId
              ? navigate(
                  `/pricing?reason=no_credits&scanId=${encodeURIComponent(scanId)}`
                )
              : navigate("/pricing")
          }
          className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200 font-semibold"
        >
          Buy credits
        </button>
      )}

      <p className="text-xs text-slate-500 leading-relaxed">
        Note: Once unlocked, this inspection is final and cannot be refunded.
      </p>
    </div>
  );
}
