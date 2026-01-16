import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { saveScan, generateScanId } from "../utils/scanStorage";

type PricingVerdict = "missing" | "info" | "room" | "concern";

function formatMoney(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function scoreFromChecks(checks: Record<string, any>) {
  const values = Object.values(checks || {});
  if (!values.length) return 0;

  let score = 100;

  for (const a of values) {
    const v = a?.value;
    if (v === "ok") score -= 0;
    if (v === "unsure") score -= 6;
    if (v === "concern") score -= 12;
  }

  return clamp(Math.round(score), 0, 100);
}

function countConcerns(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => a?.value === "concern")
    .length;
}

function countUnsure(checks: Record<string, any>) {
  return Object.values(checks || {}).filter((a: any) => a?.value === "unsure")
    .length;
}

function severityWeight(s?: string) {
  if (s === "major") return 3;
  if (s === "moderate") return 2;
  return 1;
}

function sumImperfectionWeight(imps: any[]) {
  return (imps || []).reduce((acc, it) => acc + severityWeight(it?.severity), 0);
}

function getPricingVerdict(args: {
  askingPrice?: number | null;
  concerns: number;
  unsure: number;
  imperfectionWeight: number;
}): PricingVerdict {
  const { askingPrice, concerns, unsure, imperfectionWeight } = args;

  if (!askingPrice || askingPrice <= 0) return "missing";

  const issueScore = concerns * 2 + unsure * 1 + imperfectionWeight * 0.75;

  if (issueScore >= 12) return "concern";
  if (issueScore >= 6) return "room";
  return "info";
}

function pricingCopy(verdict: PricingVerdict) {
  if (verdict === "missing") {
    return {
      title: "Add the asking price",
      body: "To assess value, we need the seller’s asking price.",
    };
  }
  if (verdict === "concern") {
    return {
      title: "Price looks high for what you’ve recorded",
      body: "Based on your concerns and imperfections, this looks like a strong negotiation candidate.",
    };
  }
  if (verdict === "room") {
    return {
      title: "There may be negotiation room",
      body: "Your inspection suggests some leverage. A small reduction is realistic if the seller confirms your concerns.",
    };
  }
  return {
    title: "Price looks roughly in the fair range",
    body: "Nothing you recorded strongly suggests the price is inflated — still confirm the key items before committing.",
  };
}

function buildTitleFromVehicle(progress: any): string {
  const v =
    progress?.vehicle ||
    progress?.vehicleDetails ||
    progress?.vehicleInfo ||
    progress?.onlineVehicle ||
    null;

  const year = typeof v?.year === "string" ? v.year : undefined;
  const make = typeof v?.make === "string" ? v.make : undefined;
  const model = typeof v?.model === "string" ? v.model : undefined;
  const variant = typeof v?.variant === "string" ? v.variant : undefined;

  const parts = [year, make, model, variant].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return "In-person inspection";
}

function buildVehicleFromProgress(progress: any) {
  const v =
    progress?.vehicle ||
    progress?.vehicleDetails ||
    progress?.vehicleInfo ||
    progress?.onlineVehicle ||
    null;

  if (!v || typeof v !== "object") return undefined;

  return {
    make: typeof v.make === "string" ? v.make : undefined,
    model: typeof v.model === "string" ? v.model : undefined,
    year: typeof v.year === "string" ? v.year : undefined,
    variant: typeof v.variant === "string" ? v.variant : undefined,
  };
}

export default function InPersonSummary() {
  const navigate = useNavigate();
  const { scanId: routeScanId } = useParams<{ scanId?: string }>();

  const progress: any = loadProgress();
  const activeScanId: string | null = progress?.scanId || routeScanId || null;

  const imperfections = progress?.imperfections ?? [];
  const followUps = progress?.followUpPhotos ?? [];
  const checks = progress?.checks ?? {};
  const photos = progress?.photos ?? [];
  const fromOnlineScan = Boolean(progress?.fromOnlineScan);

  const askingPrice: number | null =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const concerns = useMemo(() => countConcerns(checks), [checks]);
  const unsure = useMemo(() => countUnsure(checks), [checks]);
  const score = useMemo(() => scoreFromChecks(checks), [checks]);

  const imperfectionWeight = useMemo(
    () => sumImperfectionWeight(imperfections),
    [imperfections]
  );

  const verdict = useMemo(() => {
    return getPricingVerdict({
      askingPrice,
      concerns,
      unsure,
      imperfectionWeight,
    });
  }, [askingPrice, concerns, unsure, imperfectionWeight]);

  const verdictCopy = useMemo(() => pricingCopy(verdict), [verdict]);

  const [saving, setSaving] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setIsLoggedIn(Boolean(data.session));
      setAuthReady(true);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSaveAndContinue() {
    if (!activeScanId) {
      alert("Missing scan id — please restart the inspection.");
      navigate("/scan/in-person/start");
      return;
    }

    setSaving(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        alert("Please sign in to save this scan.");
        navigate("/sign-in");
        return;
      }

      const finalScanId = activeScanId || generateScanId();

      const title = buildTitleFromVehicle(progress);
      const vehicle = buildVehicleFromProgress(progress);

      await saveScan({
        id: finalScanId,
        type: "in-person",
        title,
        createdAt: new Date().toISOString(),

        vehicle,

        askingPrice,
        score,
        concerns,
        unsure,
        imperfectionsCount: imperfections.length,
        photosCount: photos.length,
        fromOnlineScan,
      });

      navigate(`/scan/in-person/preview/${finalScanId}`);
    } catch (e) {
      console.error("[InPersonSummary] save failed:", e);
      alert("Failed to save scan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleStartOver() {
    if (!confirm("Start over? This will clear your current inspection.")) return;
    clearProgress();
    navigate("/scan/in-person/start");
  }

  const canContinue = Boolean(activeScanId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          In-person inspection
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold text-white mt-2">
          Summary
        </h1>
        <p className="text-slate-400 mt-3 max-w-2xl">
          This is your quick pre-report snapshot. Next you’ll unlock the full
          report and negotiation advice.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Overall score
          </p>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <div className="text-5xl font-semibold text-white tabular-nums">
                {score}
              </div>
              <p className="text-sm text-slate-400 mt-1">out of 100</p>
            </div>

            <div className="w-28 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
                style={{ width: `${clamp(score, 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Concerns
              </p>
              <p className="text-lg font-semibold text-white tabular-nums mt-1">
                {concerns}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Unsure
              </p>
              <p className="text-lg font-semibold text-white tabular-nums mt-1">
                {unsure}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Notes
              </p>
              <p className="text-lg font-semibold text-white tabular-nums mt-1">
                {followUps.length}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Asking price
              </p>
              <p className="text-2xl font-semibold text-white mt-2">
                {formatMoney(askingPrice)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                This is used later to estimate negotiation range.
              </p>
            </div>

            <button
              onClick={() => navigate("/scan/in-person/asking-price")}
              className="rounded-xl border border-white/15 bg-slate-950/40 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Edit asking price
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <p className="text-sm font-semibold text-white">
              {verdictCopy.title}
            </p>
            <p className="text-sm text-slate-400 mt-2">{verdictCopy.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-500">
                Photos captured:{" "}
                <span className="text-slate-200 tabular-nums font-semibold">
                  {photos.length}
                </span>
              </span>

              <span className="text-xs text-slate-500">
                Imperfections recorded:{" "}
                <span className="text-slate-200 tabular-nums font-semibold">
                  {imperfections.length}
                </span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to generate your report?
            </p>
            <p className="text-sm text-slate-400 mt-1">
              You’ll unlock the full report next. Credits are only used when you
              unlock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartOver}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Start over
            </button>

            <button
              onClick={() => navigate("/scan/in-person/checks/around")}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Review checks
            </button>

            <button
              onClick={handleSaveAndContinue}
              disabled={!canContinue || saving || (authReady && !isLoggedIn)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                "bg-emerald-500 hover:bg-emerald-400 text-black",
                !canContinue || saving || (authReady && !isLoggedIn)
                  ? "opacity-60 cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>

        {authReady && !isLoggedIn && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-semibold">
              Sign in required to save this scan
            </p>
            <p className="text-sm text-slate-300 mt-1">
              You can still complete an inspection, but to unlock and store your
              report you’ll need to sign in.
            </p>
            <div className="mt-3">
              <button
                onClick={() => navigate("/sign-in")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-semibold px-4 py-2 text-sm"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
