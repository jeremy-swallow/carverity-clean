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
  Sparkles,
  ArrowRight,
} from "lucide-react";

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
    title: "Single inspection",
    price: "$14.99",
    credits: 1,
    context: "For a one-off vehicle you want confidence on.",
  },
  {
    key: "three",
    title: "Inspection bundle",
    price: "$39",
    credits: 3,
    context: "Ideal if you’re comparing a few vehicles.",
    note: "Most people choose this option",
    recommended: true,
  },
  {
    key: "five",
    title: "Extended bundle",
    price: "$59",
    credits: 5,
    context: "Best value if you’re actively shopping.",
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

  // “Restore” UI:
  // This should now almost never show once create-checkout-session returns to the SAME origin.
  // Keep it as a gentle fallback (we don’t pretend we can restore auth from Stripe).
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
        navigate("/sign-in");
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pack }),
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      {/* Header */}
      <header className="max-w-2xl mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1.5 mb-4">
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <span className="text-[12px] text-slate-200">
            Credits unlock the final report
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">
          Straightforward pricing
        </h1>

        <p className="text-slate-400 text-base leading-relaxed">
          Each inspection gives you a structured assessment you can trust when
          viewing a vehicle in person.
        </p>
      </header>

      {/* Trust strip (premium + credible) */}
      <section className="mb-10 rounded-2xl border border-white/10 bg-slate-900/40 px-6 py-5 relative overflow-hidden">
        {/* subtle premium glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Secure checkout, buyer-safe product
            </p>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Payments are processed by Stripe. Credits are added to your
              account instantly after purchase.
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

        <div className="relative mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                  You’re not currently signed in on this device. If you used a
                  different domain (www vs non-www), it can look signed out. Tap{" "}
                  <span className="text-slate-200">Sign in</span>.
                </>
              )}
            </p>
          )}

          {sessionReady && !isLoggedIn && (
            <div className="pt-2">
              <button
                onClick={() => navigate("/sign-in")}
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

      {/* Account status / credits */}
      <section className="mb-12 rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
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
              Not signed in · Sign in to buy credits and unlock reports
            </p>
          )}
        </div>

        {sessionReady && !isLoggedIn && (
          <button
            onClick={() => navigate("/sign-in")}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 text-sm"
          >
            Sign in
          </button>
        )}
      </section>

      {/* Pricing */}
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
                  : "border-white/10 bg-slate-900/55",
              ].join(" ")}
            >
              {/* Card glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              </div>

              {/* top badge */}
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
                    {plural(pack.credits, "inspection")}
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

      <p className="mt-16 text-sm text-slate-500 max-w-2xl leading-relaxed">
        Credits never expire. You only use a credit when you unlock a completed
        inspection report.
      </p>
    </div>
  );
}
