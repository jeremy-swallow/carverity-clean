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

function asSafeScanId(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v) return "";

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  return uuidLike ? v : "";
}

function parseAUD(price: string): number | null {
  const n = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
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

  const reason = useMemo(() => (params.get("reason") || "").trim(), [params]);

  // If the user came here from unlock due to no credits, we preserve scanId
  const scanId = useMemo(
    () => asSafeScanId(params.get("scanId") || ""),
    [params]
  );

  // If Stripe returns to Pricing (cancel_url), we should offer a “Return to scan”
  const returnToUnlock = useMemo(() => {
    if (!scanId) return "";
    return `/scan/in-person/unlock/${encodeURIComponent(scanId)}`;
  }, [scanId]);

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

  // If we returned from Stripe with success=1 (legacy / fallback),
  // do an extra refresh loop so credits show quickly.
  //
  // NOTE:
  // Our preferred flow is to return to /scan/in-person/unlock/success,
  // not Pricing. But this keeps the page resilient if Stripe config
  // or old sessions still return here.
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
          // preserve scanId so cancel_url keeps the user connected to their scan
          scanId: scanId || null,
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

  const packMeta = useMemo(() => {
    const single = PACKS.find((p) => p.key === "single") || null;
    const singlePrice = single ? parseAUD(single.price) : null;

    return PACKS.map((p) => {
      const price = parseAUD(p.price);
      const perCredit =
        price != null && p.credits > 0 ? price / p.credits : null;

      let savingsText: string | null = null;
      if (singlePrice != null && price != null) {
        const implied = singlePrice * p.credits;
        const diff = implied - price;
        if (diff > 0.01 && p.key !== "single") {
          savingsText = `Save $${Math.round(diff)} vs single`;
        }
      }

      return {
        key: p.key,
        perCredit,
        savingsText,
      };
    });
  }, []);

  const metaByKey = useMemo(() => {
    const map: Record<string, { perCredit: number | null; savingsText: string | null }> =
      {};
    for (const m of packMeta) {
      map[m.key] = { perCredit: m.perCredit, savingsText: m.savingsText };
    }
    return map;
  }, [packMeta]);

  const showNoCreditsNudge = useMemo(
    () => reason === "no_credits" && Boolean(scanId),
    [reason, scanId]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      {/* Ambient background (subtle, modern) */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-[35%] -left-40 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
      </div>

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
          report generation begins (the moment analysis starts).
        </p>

        {showNoCreditsNudge && (
          <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4">
            <p className="text-sm text-amber-200 font-semibold">
              You need 1 credit to unlock this report
            </p>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              After purchase, you’ll return here — then you can go straight back
              to your scan.
            </p>
          </div>
        )}
      </header>

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

      {/* Success / Cancel banners (Pricing should rarely get success now, but keep it safe) */}
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
              onClick={() => refreshAuthAndCredits()}
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm inline-flex items-center gap-2 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={() => navigate("/my-scans")}
              className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm hover:bg-white/5"
            >
              View My Scans
            </button>

            <button
              onClick={() => navigate("/start")}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
            >
              Start scan
            </button>

            {returnToUnlock && (
              <button
                onClick={() => navigate(returnToUnlock)}
                className="rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-white/10 px-4 py-2 text-sm font-semibold"
              >
                Return to scan
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
        <section className="mb-10 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-6 py-5 space-y-3">
          <p className="text-amber-200 font-semibold">Checkout cancelled</p>
          <p className="text-sm text-slate-300">
            No payment was taken. You can try again anytime.
          </p>

          {returnToUnlock && (
            <div className="pt-1">
              <button
                onClick={() => navigate(returnToUnlock)}
                className="rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-white/10 px-4 py-2 text-sm font-semibold"
              >
                Return to scan
              </button>
            </div>
          )}
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

          const meta = metaByKey[pack.key];
          const perCreditText =
            meta?.perCredit != null ? `$${meta.perCredit.toFixed(2)} / credit` : "";
          const savingsText = meta?.savingsText || "";

          return (
            <div
              key={pack.key}
              className={[
                "group relative rounded-2xl border px-6 py-8 flex flex-col",
                "transition duration-200",
                "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30",
                isRecommended
                  ? [
                      // Stronger “recommended” highlight (your missing emphasis)
                      "border-emerald-400/50 bg-emerald-900/15",
                      "ring-2 ring-emerald-400/40",
                      "shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_25px_60px_rgba(0,0,0,0.35)]",
                    ].join(" ")
                  : "border-white/10 bg-slate-900/60",
              ].join(" ")}
            >
              {/* Glow layer */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
              </div>

              {/* Always-on recommended glow (so it’s visible even without hover) */}
              {isRecommended && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl" />
                  <div className="absolute -bottom-32 right-[-80px] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
                </div>
              )}

              {isRecommended && (
                <div className="absolute -top-3 left-6 flex items-center gap-2">
                  <span className="text-[10px] tracking-[0.18em] uppercase text-emerald-200">
                    Recommended
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                    Most popular
                  </span>
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

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                      Used at analysis start
                    </span>

                    {perCreditText && (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                        {perCreditText}
                      </span>
                    )}

                    {savingsText && (
                      <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        {savingsText}
                      </span>
                    )}
                  </div>
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
                  "focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:ring-offset-0",
                  isRecommended
                    ? [
                        // Premium CTA (more “intentional” than flat green)
                        "text-black",
                        "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400",
                        "hover:brightness-110",
                        "shadow-[0_16px_40px_rgba(16,185,129,0.18)]",
                        "border border-emerald-200/20",
                      ].join(" ")
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
