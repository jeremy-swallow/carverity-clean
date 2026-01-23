// src/pages/Pricing.tsx

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Receipt,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  FileText,
  Timer,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type PackKey = "single" | "three" | "five";

type PackOption = {
  key: PackKey;
  title: string;
  price: string;
  context: string;
  credits: number;
  note?: string;
  recommended?: boolean;
};

const PACKS: PackOption[] = [
  {
    key: "single",
    title: "Single report credit",
    price: "$14.99",
    credits: 1,
    context: "For one vehicle you want clarity on.",
  },
  {
    key: "three",
    title: "3-pack",
    price: "$39",
    credits: 3,
    context: "Best if you’re comparing a few options.",
    note: "Most popular",
    recommended: true,
  },
  {
    key: "five",
    title: "5-pack",
    price: "$59",
    credits: 5,
    context: "Best value for active shopping.",
  },
];

function formatCredits(n: number | null) {
  if (n == null) return "—";
  return String(Math.max(0, Math.floor(n)));
}

function plural(n: number, singular: string, pluralWord?: string) {
  if (n === 1) return singular;
  return pluralWord ?? `${singular}s`;
}

export default function Pricing() {
  const [loadingPack, setLoadingPack] = useState<PackKey | null>(null);

  const [sessionReady, setSessionReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const [justReturnedFromCheckout, setJustReturnedFromCheckout] =
    useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const success = useMemo(() => params.get("success") === "1", [params]);
  const restore = useMemo(() => params.get("restore") === "1", [params]);
  const cancelled = useMemo(
    () => params.get("canceled") === "1" || params.get("cancelled") === "1",
    [params]
  );

  const reason = useMemo(() => params.get("reason") || "", [params]);
  const scanIdFromQuery = useMemo(() => params.get("scanId") || "", [params]);

  const cameFromNoCreditsGate = reason === "no_credits" && Boolean(scanIdFromQuery);

  async function refreshAuthAndCredits() {
    setLoadingCredits(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;

      setIsLoggedIn(Boolean(session));
      setSessionReady(true);

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
        console.warn("[Pricing] Failed to fetch credits:", error);
        setCredits(null);
        return;
      }

      setCredits(typeof profile?.credits === "number" ? profile.credits : 0);
    } finally {
      setLoadingCredits(false);
    }
  }

  // Initial load + auth listener
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

  // If we returned from Stripe with success=1, do an extra refresh loop
  // so the UI feels instant (credits appear without user reloading).
  useEffect(() => {
    if (!success) return;

    setJustReturnedFromCheckout(true);

    let cancelledFlag = false;

    async function refreshLoop() {
      const delays = [0, 350, 700, 1200, 1800, 2500];

      for (const ms of delays) {
        if (cancelledFlag) return;

        if (ms > 0) await new Promise((r) => setTimeout(r, ms));

        await refreshAuthAndCredits();
      }
    }

    refreshLoop();

    return () => {
      cancelledFlag = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // If user came here from an in-person unlock gate, persist a resume-safe step.
  useEffect(() => {
    if (!cameFromNoCreditsGate) return;
    if (!scanIdFromQuery) return;

    const existing: any = loadProgress() ?? {};

    // Only set if it looks like an in-person flow (or empty).
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      scanId: scanIdFromQuery,
      step: `/scan/in-person/unlock/${scanIdFromQuery}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameFromNoCreditsGate, scanIdFromQuery]);

  // Auto-continue after successful purchase if we have scanId and credits > 0
  useEffect(() => {
    if (!success) return;
    if (!cameFromNoCreditsGate) return;
    if (!scanIdFromQuery) return;
    if (!sessionReady || !isLoggedIn) return;
    if (loadingCredits) return;

    const safeCredits = typeof credits === "number" ? credits : 0;
    if (safeCredits <= 0) return;

    // Give it a tiny moment so UI can show success, then continue.
    const t = setTimeout(() => {
      navigate(`/scan/in-person/unlock/${scanIdFromQuery}`, { replace: true });
    }, 650);

    return () => clearTimeout(t);
  }, [
    success,
    cameFromNoCreditsGate,
    scanIdFromQuery,
    sessionReady,
    isLoggedIn,
    loadingCredits,
    credits,
    navigate,
  ]);

  // “Restore” UI fallback
  const inRestoreWindow =
    success && restore && (!sessionReady || (sessionReady && !isLoggedIn));

  async function startCheckout(pack: PackKey) {
    try {
      setLoadingPack(pack);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("Please sign in to continue.");
        navigate("/signin");
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          pack,
          // pass through scanId if user is mid-unlock
          scanId: scanIdFromQuery || null,
          reason: cameFromNoCreditsGate ? "no_credits" : null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        console.error("[Pricing] Checkout failed:", data);
        alert("Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url as string;
    } catch (err) {
      console.error("[Pricing] startCheckout error:", err);
      alert("Unexpected error starting checkout.");
    } finally {
      setLoadingPack(null);
    }
  }

  const showCreditsLine = sessionReady;

  const canContinueUnlock =
    Boolean(scanIdFromQuery) &&
    sessionReady &&
    isLoggedIn &&
    !loadingCredits &&
    (credits ?? 0) > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      {/* Header */}
      <header className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <span className="text-[12px] text-slate-200">
            Pay only when you generate the report
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
          Pricing that’s simple and fair
        </h1>

        <p className="text-slate-400 text-base leading-relaxed">
          Start the in-person inspection for free. A credit is used only when
          you begin report generation (the moment the analysis starts).
        </p>
      </header>

      {/* If user is mid-flow, show a strong “Continue” panel */}
      {cameFromNoCreditsGate && (
        <section className="mb-10 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-6 py-5 space-y-3">
          <p className="text-amber-200 font-semibold">
            You’re unlocking a report
          </p>
          <p className="text-sm text-slate-300">
            You were mid-way through unlocking a report for this inspection.
            After purchase, you can continue instantly.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() =>
                navigate(`/scan/in-person/unlock/${scanIdFromQuery}`)
              }
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
            >
              Back to unlock
            </button>

            <button
              onClick={() => navigate("/scan/in-person/summary")}
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
            >
              Back to summary
            </button>

            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
            >
              Home
            </button>
          </div>

          {canContinueUnlock && (
            <div className="pt-2">
              <button
                onClick={() =>
                  navigate(`/scan/in-person/unlock/${scanIdFromQuery}`, {
                    replace: true,
                  })
                }
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 text-sm inline-flex items-center justify-center gap-2"
              >
                Continue unlocking report
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* “How it works” strip */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                What your credit covers
              </p>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                A credit is consumed when report generation begins. You can walk
                through the inspection first and decide later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
                <FileText className="h-4 w-4 text-slate-300" />
                Full report output
              </span>

              <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
                <Timer className="h-4 w-4 text-slate-300" />
                Uses credit at analysis start
              </span>

              <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
                <BadgeCheck className="h-4 w-4 text-slate-300" />
                Stored on your account
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Step 1
              </p>
              <p className="text-sm text-slate-200 mt-1 font-semibold">
                Inspect the car
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Follow the guided checks and take photos if you want.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Step 2
              </p>
              <p className="text-sm text-slate-200 mt-1 font-semibold">
                Review your notes
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Make sure everything important is captured before analysis.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Step 3
              </p>
              <p className="text-sm text-slate-200 mt-1 font-semibold">
                Generate the report
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A credit is used when report generation begins.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-500">
            By purchasing, you agree to our{" "}
            <NavLink
              to="/terms"
              className="text-slate-300 underline underline-offset-4 decoration-white/10 hover:decoration-white/30 hover:text-white"
            >
              Terms
            </NavLink>{" "}
            and{" "}
            <NavLink
              to="/privacy"
              className="text-slate-300 underline underline-offset-4 decoration-white/10 hover:decoration-white/30 hover:text-white"
            >
              Privacy Policy
            </NavLink>
            .
          </p>

          <p className="text-xs text-slate-600">
            Need help?{" "}
            <a
              href="mailto:support@carverity.com.au"
              className="text-slate-300 underline underline-offset-4 decoration-white/10 hover:decoration-white/30 hover:text-white"
            >
              support@carverity.com.au
            </a>
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Secure checkout and transparent billing
            </p>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Payments are processed by Stripe. Credits are added to your
              account after purchase and can be used any time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-slate-300" />
              Stripe secured
            </span>

            <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
              <CreditCard className="h-4 w-4 text-slate-300" />
              No card storage
            </span>

            <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
              <Lock className="h-4 w-4 text-slate-300" />
              Sign-in required
            </span>

            <span className="inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full border border-white/10 bg-slate-950/30 text-slate-300">
              <Receipt className="h-4 w-4 text-slate-300" />
              Tax invoice via Stripe
            </span>
          </div>
        </div>
      </section>

      {/* Success / Cancel banners */}
      {success && (
        <section className="mb-10 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-6 py-5 space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5" />
            <div className="min-w-0">
              <p className="text-emerald-200 font-semibold">
                Purchase successful
              </p>

              <p className="text-sm text-slate-300 mt-1">
                {inRestoreWindow
                  ? "Finalising your purchase… (if this doesn’t update in a few seconds, tap Refresh)"
                  : "Your credits should now be available on your account."}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/start-scan")}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
            >
              Start scan
            </button>
            <button
              onClick={() => navigate("/my-scans")}
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
            >
              View My Scans
            </button>

            {cameFromNoCreditsGate && scanIdFromQuery && (
              <button
                onClick={() =>
                  navigate(`/scan/in-person/unlock/${scanIdFromQuery}`)
                }
                className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                Continue unlock
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {inRestoreWindow && (
              <button
                onClick={() => refreshAuthAndCredits()}
                className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            )}
          </div>

          {showCreditsLine && (
            <p className="text-xs text-slate-400 pt-2">
              {isLoggedIn ? (
                <>
                  Credits detected:{" "}
                  <span className="text-slate-200 font-semibold tabular-nums">
                    {loadingCredits ? "…" : formatCredits(credits)}
                  </span>
                  {justReturnedFromCheckout && loadingCredits ? (
                    <span className="text-slate-500"> (updating…)</span>
                  ) : null}
                </>
              ) : (
                <>
                  You’re not currently signed in on this device. Tap{" "}
                  <span className="text-slate-200">Sign in</span>.
                </>
              )}
            </p>
          )}

          {sessionReady && !isLoggedIn && (
            <div className="pt-2">
              <button
                onClick={() => navigate("/signin")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 text-sm"
              >
                Sign in
              </button>
            </div>
          )}
        </section>
      )}

      {cancelled && (
        <section className="mb-10 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-6 py-5 space-y-2">
          <p className="text-amber-200 font-semibold">Checkout cancelled</p>
          <p className="text-sm text-slate-300">
            No payment was taken. You can try again anytime.
          </p>
        </section>
      )}

      {/* Account status */}
      <section className="mb-12 rounded-2xl border border-white/10 bg-slate-900/55 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Account status
          </p>

          {!sessionReady ? (
            <p className="text-sm text-slate-300 mt-1">Checking sign-in…</p>
          ) : isLoggedIn ? (
            <p className="text-sm text-slate-300 mt-1">
              Signed in · Credits:{" "}
              <span className="text-white font-semibold tabular-nums">
                {loadingCredits ? "…" : formatCredits(credits)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-300 mt-1">
              Not signed in · Sign in to buy credits and generate reports
            </p>
          )}
        </div>

        {sessionReady && !isLoggedIn && (
          <button
            onClick={() => navigate("/signin")}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 text-sm"
          >
            Sign in
          </button>
        )}
      </section>

      {/* Pricing cards */}
      <div className="grid gap-8 md:grid-cols-3">
        {PACKS.map((pack) => {
          const isRecommended = Boolean(pack.recommended);
          const isLoading = loadingPack === pack.key;

          return (
            <div
              key={pack.key}
              className={[
                "group relative rounded-2xl border px-6 py-8 flex flex-col overflow-hidden",
                "transition duration-200",
                "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30",
                isRecommended
                  ? "border-emerald-500/40 bg-emerald-900/15"
                  : "border-white/10 bg-slate-900/60",
              ].join(" ")}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              </div>

              {isRecommended && (
                <div className="absolute -top-3 left-6 text-xs tracking-wide uppercase text-emerald-300">
                  Recommended
                </div>
              )}

              <div className="relative">
                <h2 className="text-lg font-semibold text-white mb-1 tracking-tight">
                  {pack.title}
                </h2>

                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {pack.context}
                </p>

                <div className="mb-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Includes
                  </p>
                  <p className="text-sm text-slate-200 mt-1">
                    <span className="font-semibold text-white tabular-nums">
                      {pack.credits}
                    </span>{" "}
                    {plural(pack.credits, "report credit")}
                  </p>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Used when report generation begins.
                  </p>
                </div>

                <div className="flex items-end justify-between gap-3 mb-2">
                  <div className="text-3xl font-semibold text-white tracking-tight">
                    {pack.price}
                  </div>

                  <div className="text-xs text-slate-500 text-right">
                    Adds{" "}
                    <span className="text-slate-200 font-semibold tabular-nums">
                      {pack.credits}
                    </span>{" "}
                    {plural(pack.credits, "credit")}
                  </div>
                </div>

                {pack.note && (
                  <p className="text-xs text-slate-400 mb-6">{pack.note}</p>
                )}
              </div>

              <button
                onClick={() => startCheckout(pack.key)}
                disabled={isLoading}
                className={[
                  "relative mt-auto rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2",
                  isRecommended
                    ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                    : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10",
                  isLoading ? "opacity-60 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {isLoading ? "Preparing checkout…" : "Continue"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </button>

              {!isLoggedIn && sessionReady && (
                <p className="mt-3 text-xs text-slate-500">
                  Sign in is required to purchase credits.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <section className="mt-14 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <p className="text-sm font-semibold text-white mb-2">Good to know</p>

        <ul className="space-y-2 text-sm text-slate-400 leading-relaxed">
          <li>
            <span className="text-slate-200 font-semibold">
              Credits never expire.
            </span>{" "}
            Use them whenever you’re ready.
          </li>
          <li>
            <span className="text-slate-200 font-semibold">
              No credit is used during the inspection itself.
            </span>{" "}
            A credit is used only when report generation begins.
          </li>
          <li>
            <span className="text-slate-200 font-semibold">
              Reports are tied to your account.
            </span>{" "}
            You can revisit them from{" "}
            <button
              onClick={() => navigate("/my-scans")}
              className="text-slate-200 underline underline-offset-4 decoration-white/10 hover:decoration-white/30 hover:text-white"
            >
              My Scans
            </button>
            .
          </li>
        </ul>
      </section>
    </div>
  );
}
