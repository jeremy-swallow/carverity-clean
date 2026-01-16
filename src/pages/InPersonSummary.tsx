// src/pages/InPersonSummary.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Camera,
  Sparkles,
  RefreshCcw,
  ClipboardCheck,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { loadProgress, clearProgress, saveProgress } from "../utils/scanProgress";
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
  return 1; // minor/default
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

  // Heuristic: more issues => price sensitivity increases
  const issueScore = concerns * 2 + unsure * 1 + imperfectionWeight * 0.75;

  if (issueScore >= 12) return "concern";
  if (issueScore >= 6) return "room";
  return "info";
}

function pricingCopy(verdict: PricingVerdict) {
  if (verdict === "missing") {
    return {
      tone: "info" as const,
      title: "Add the asking price",
      body:
        "This helps CarVerity assess whether the asking price looks aligned with what you recorded — and what to verify before you commit.",
    };
  }
  if (verdict === "concern") {
    return {
      tone: "warn" as const,
      title: "Asking price looks optimistic for what you recorded",
      body:
        "You captured multiple risk signals. The report will focus on what they mean, what to clarify, and what would make walking away reasonable.",
    };
  }
  if (verdict === "room") {
    return {
      tone: "info" as const,
      title: "Price sensitivity is elevated",
      body:
        "You recorded a few meaningful signals. The report will convert them into clear follow-ups and a buyer-safe decision guide.",
    };
  }
  return {
    tone: "good" as const,
    title: "Nothing you recorded strongly contradicts the asking price",
    body:
      "That’s a good sign — but the report will still highlight the few checks that matter most before you decide.",
  };
}

function parseAskingPrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  const rounded = Math.round(n);
  if (rounded <= 0) return null;

  return clamp(rounded, 1, 5_000_000);
}

function buildTitleFromProgress(progress: any): string {
  const make =
    progress?.vehicle?.make || progress?.make || progress?.vehicleMake;
  const model =
    progress?.vehicle?.model || progress?.model || progress?.vehicleModel;
  const year =
    progress?.vehicle?.year || progress?.year || progress?.vehicleYear;

  const parts = [year, make, model].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return "In-person inspection";
}

function scoreBand(score: number) {
  if (score >= 85) return { label: "Low risk", tone: "good" as const };
  if (score >= 70) return { label: "Mixed", tone: "info" as const };
  if (score >= 55) return { label: "Higher risk", tone: "warn" as const };
  return { label: "High risk", tone: "danger" as const };
}

function toneClasses(tone: "good" | "info" | "warn" | "danger") {
  if (tone === "good") {
    return {
      pill: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      bar: "bg-emerald-500",
      icon: "text-emerald-300",
    };
  }
  if (tone === "warn") {
    return {
      pill: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      bar: "bg-amber-400",
      icon: "text-amber-300",
    };
  }
  if (tone === "danger") {
    return {
      pill: "bg-rose-500/10 text-rose-200 border-rose-500/20",
      bar: "bg-rose-400",
      icon: "text-rose-300",
    };
  }
  return {
    pill: "bg-sky-500/10 text-sky-200 border-sky-500/20",
    bar: "bg-sky-400",
    icon: "text-sky-300",
  };
}

function hasAnyDriveAnswers(checks: Record<string, any>) {
  const driveIds = ["steering", "noise-hesitation", "adas-systems"];
  return driveIds.some((id) => Boolean(checks?.[id]?.value || checks?.[id]?.note));
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

  const [askingPriceInput, setAskingPriceInput] = useState<string>(() => {
    if (askingPrice && askingPrice > 0) return String(Math.round(askingPrice));
    return "";
  });

  const [askingPriceTouched, setAskingPriceTouched] = useState(false);

  const parsedAskingPrice = useMemo(() => {
    return parseAskingPrice(askingPriceInput);
  }, [askingPriceInput]);

  // Persist asking price into progress as user types
  useEffect(() => {
    const latest: any = loadProgress();
    const current =
      typeof latest?.askingPrice === "number" ? latest.askingPrice : null;

    if (parsedAskingPrice === current) return;

    saveProgress({
      ...(latest ?? {}),
      askingPrice: parsedAskingPrice,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedAskingPrice]);

  const concerns = useMemo(() => countConcerns(checks), [checks]);
  const unsure = useMemo(() => countUnsure(checks), [checks]);
  const score = useMemo(() => scoreFromChecks(checks), [checks]);

  const imperfectionWeight = useMemo(
    () => sumImperfectionWeight(imperfections),
    [imperfections]
  );

  const verdict = useMemo(() => {
    return getPricingVerdict({
      askingPrice: parsedAskingPrice,
      concerns,
      unsure,
      imperfectionWeight,
    });
  }, [parsedAskingPrice, concerns, unsure, imperfectionWeight]);

  const verdictCopy = useMemo(() => pricingCopy(verdict), [verdict]);

  const band = useMemo(() => scoreBand(score), [score]);
  const bandTone = toneClasses(band.tone);
  const verdictTone = toneClasses(verdictCopy.tone);

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
      const title = buildTitleFromProgress(progress);

      await saveScan({
        id: finalScanId,
        type: "in-person",
        title,
        createdAt: new Date().toISOString(),

        askingPrice: parsedAskingPrice,
        score,
        concerns,
        unsure,
        imperfectionsCount: imperfections.length,
        photosCount: photos.length,
        fromOnlineScan,
      });

      navigate(`/scan/in-person/analyzing/${finalScanId}`);
    } catch (e) {
      console.error("[InPersonSummary] save failed:", e);
      alert("Failed to save scan. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleStartOver() {
    if (!confirm("Start over? This will clear your current inspection.")) {
      return;
    }
    clearProgress();
    navigate("/scan/in-person/start");
  }

  function handleDoDriveNow() {
    // If they skipped earlier, we route them into the drive intro,
    // which clears stale drive answers and prevents highlighted buttons.
    navigate("/scan/in-person/checks/drive-intro");
  }

  const canContinue = Boolean(activeScanId);

  const showAskingPriceError =
    askingPriceTouched &&
    askingPriceInput.trim().length > 0 &&
    !parsedAskingPrice;

  const driveWasSkippedOrMissing = !hasAnyDriveAnswers(checks);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
          In-person inspection
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[240px]">
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              Summary
            </h1>
            <p className="text-slate-400 mt-3 max-w-2xl leading-relaxed">
              This is a calm snapshot of what you recorded. Next, CarVerity will
              turn it into a buyer-safe report with clear reasoning and next
              steps — without hype or pressure.
            </p>
          </div>

          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5",
              "text-xs font-semibold",
              bandTone.pill,
            ].join(" ")}
          >
            <CheckCircle2 className={["h-4 w-4", bandTone.icon].join(" ")} />
            {band.label}
          </div>
        </div>
      </header>

      {/* If drive checks were skipped, give them a way back */}
      {driveWasSkippedOrMissing && (
        <div className="mb-8 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-300 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                Skipped test drive earlier — you can still do it now
              </p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                If the situation changed (or you tapped skip by accident), you
                can run the quick drive checks before generating the report.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleDoDriveNow}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
                >
                  Do drive checks now
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/scan/in-person/checks/inside")}
                  className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
                >
                  Go back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Score card */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Overall score
              </p>
              <div className="mt-4 flex items-end gap-3">
                <div className="text-5xl font-semibold text-white tabular-nums">
                  {score}
                </div>
                <div className="pb-1">
                  <p className="text-sm text-slate-400">out of 100</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Snapshot
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This score reflects your recorded answers only.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={["h-full rounded-full", bandTone.bar].join(" ")}
                style={{ width: `${clamp(score, 0, 100)}%` }}
              />
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
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="h-4 w-4 text-slate-300 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-white">
                  What this snapshot is for
                </p>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  It helps you sanity-check the inspection before you generate
                  the report. If something feels missing, review checks now —
                  it’s faster than fixing it later.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Asking price + verdict */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-[240px] flex-1">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Advertised asking price (AUD)
              </p>

              <div className="mt-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <input
                    value={askingPriceInput}
                    onChange={(e) => setAskingPriceInput(e.target.value)}
                    onBlur={() => setAskingPriceTouched(true)}
                    inputMode="numeric"
                    placeholder="e.g. 18,990"
                    className={[
                      "w-full rounded-xl border bg-slate-950/40 px-9 py-3 text-white",
                      "placeholder:text-slate-600 outline-none",
                      showAskingPriceError
                        ? "border-amber-400/50 focus:border-amber-400/70"
                        : "border-white/10 focus:border-emerald-400/40",
                    ].join(" ")}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Used to assess price alignment with your recorded evidence.
                  </p>

                  <p className="text-xs text-slate-400">
                    Saved as:{" "}
                    <span className="text-slate-200 font-semibold tabular-nums">
                      {formatMoney(parsedAskingPrice)}
                    </span>
                  </p>
                </div>

                {showAskingPriceError && (
                  <p className="text-xs text-amber-200 mt-2">
                    Enter a valid price (numbers only).
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Current
                </p>
                <p className="text-lg font-semibold text-white tabular-nums mt-1">
                  {formatMoney(parsedAskingPrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex items-start gap-3">
              {verdictCopy.tone === "warn" ? (
                <AlertTriangle
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              ) : verdictCopy.tone === "good" ? (
                <CheckCircle2
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              ) : (
                <Info
                  className={["h-4 w-4 mt-0.5", verdictTone.icon].join(" ")}
                />
              )}

              <div className="flex-1">
                <p className="text-sm font-semibold text-white">
                  {verdictCopy.title}
                </p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {verdictCopy.body}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                    <Camera className="h-3.5 w-3.5 text-slate-400" />
                    Photos captured:{" "}
                    <span className="text-slate-200 tabular-nums font-semibold">
                      {photos.length}
                    </span>
                  </span>

                  <span className="text-xs text-slate-500 inline-flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    Imperfections recorded:{" "}
                    <span className="text-slate-200 tabular-nums font-semibold">
                      {imperfections.length}
                    </span>
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-slate-200 font-semibold">
                      Buyer-safe logic:
                    </span>{" "}
                    CarVerity won’t “fill in gaps”. If you marked items as
                    unsure, the report treats them as questions to clarify — not
                    automatic negatives.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calm expectations (premium feel) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                What you’ll get
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Clear reasoning
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                “Why this matters” explanations tied to what you recorded.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                What to do next
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Practical follow-ups
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The few questions that reduce buyer regret the most.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Price alignment
              </p>
              <p className="text-sm text-slate-200 font-semibold mt-2">
                Sanity-check signal
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A calm read on whether the asking price fits what you recorded.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <section className="mt-10 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to generate your report?
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Credits are only used when you unlock. If you want to change
              anything, review checks first.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleStartOver}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4 text-slate-300" />
              Start over
            </button>

            <button
              onClick={() => navigate("/scan/in-person/checks/intro")}
              className="rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200 inline-flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4 text-slate-300" />
              Review checks
            </button>

            <button
              onClick={handleSaveAndContinue}
              disabled={!canContinue || saving || (authReady && !isLoggedIn)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition inline-flex items-center gap-2",
                "bg-emerald-500 hover:bg-emerald-400 text-black",
                !canContinue || saving || (authReady && !isLoggedIn)
                  ? "opacity-60 cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              <ArrowRight className="h-4 w-4" />
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>

        {authReady && !isLoggedIn && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200 font-semibold">
              Sign in required to save this scan
            </p>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
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

      {/* Subtle footer reassurance */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/30 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-300 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              Calm guidance, not car-yard hype
            </p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              CarVerity is designed to reduce buyer regret. The report focuses
              on what your inspection means, what to clarify, and when to walk
              away — without scripts or pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
