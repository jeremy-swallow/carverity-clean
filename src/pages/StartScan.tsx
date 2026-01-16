// src/pages/StartScan.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function formatCredits(n: number | null) {
  if (n == null) return "—";
  return String(Math.max(0, Math.floor(n)));
}

export default function StartScan() {
  const navigate = useNavigate();

  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  async function refreshAuthAndCredits() {
    setLoadingCredits(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;

      setIsLoggedIn(Boolean(session));
      setAuthReady(true);

      if (!session) {
        setCredits(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.warn("[StartScan] Failed to fetch credits:", error);
        setCredits(null);
        return;
      }

      setCredits(typeof profile?.credits === "number" ? profile.credits : 0);
    } finally {
      setLoadingCredits(false);
    }
  }

  useEffect(() => {
    refreshAuthAndCredits();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshAuthAndCredits();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function beginInPerson() {
    // If we’re still loading, don’t route yet (prevents false redirects)
    if (!authReady || loadingCredits) return;

    // Must be signed in to start
    if (!isLoggedIn) {
      navigate("/sign-in");
      return;
    }

    const safeCredits = typeof credits === "number" ? credits : 0;

    // Hard gate: must have at least 1 credit to start a scan
    if (safeCredits <= 0) {
      navigate("/pricing?reason=no_credits");
      return;
    }

    navigate("/scan/in-person/start");
  }

  const buttonDisabled = !authReady || loadingCredits;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person inspection
      </span>

      <h1 className="text-2xl font-semibold text-white">
        Begin your in-person inspection
      </h1>

      <p className="text-slate-300">
        CarVerity guides you through a calm, real-world inspection of the
        vehicle. You’ll take a few key photos, follow guided checks, and note
        anything worth confirming.
      </p>

      <p className="text-sm text-slate-400">
        This process focuses on observations and confidence — not pricing or
        diagnosis.
      </p>

      {/* Status line (premium, calm, not “form-like”) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          Access check
        </p>

        {!authReady ? (
          <p className="text-sm text-slate-300 mt-2">Checking sign-in…</p>
        ) : !isLoggedIn ? (
          <p className="text-sm text-slate-300 mt-2">
            You’re not signed in. Sign in to start an inspection.
          </p>
        ) : (
          <p className="text-sm text-slate-300 mt-2">
            Credits available:{" "}
            <span className="text-white font-semibold tabular-nums">
              {loadingCredits ? "…" : formatCredits(credits)}
            </span>
          </p>
        )}

        {authReady && isLoggedIn && !loadingCredits && (credits ?? 0) <= 0 && (
          <p className="text-xs text-slate-500 mt-2">
            You need at least 1 credit to start a scan.
          </p>
        )}
      </div>

      <button
        onClick={beginInPerson}
        disabled={buttonDisabled}
        className={[
          "w-full rounded-xl font-semibold px-5 py-3 shadow transition",
          buttonDisabled
            ? "bg-slate-800 text-slate-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {buttonDisabled ? "Preparing…" : "Start in-person inspection"}
      </button>

      {authReady && !isLoggedIn && (
        <button
          onClick={() => navigate("/sign-in")}
          className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-5 py-3 text-slate-200 font-semibold"
        >
          Sign in
        </button>
      )}

      {authReady && isLoggedIn && !loadingCredits && (credits ?? 0) <= 0 && (
        <button
          onClick={() => navigate("/pricing")}
          className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-5 py-3 text-slate-200 font-semibold"
        >
          Buy credits
        </button>
      )}
    </div>
  );
}
