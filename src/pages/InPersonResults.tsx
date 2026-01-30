// src/pages/InPersonResults.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ArrowRight,
  ShieldCheck,
  BadgeDollarSign,
  Flag,
  Info,
  Printer,
  Sparkles,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

/* ================= split logic ================= */
import { resolvePhotoUrls } from "./inPersonResults/photoLogic";
import {
  buildVerdictOutcome,
  countRisksBySeverity,
} from "./inPersonResults/verdictLogic";
import { extractUncertaintyFactors } from "./inPersonResults/evidenceLogic";
import { RESULTS_COPY } from "./inPersonResults/copy";

/* ================= pricing ================= */
import { buildGuidedPricePositioning } from "../utils/decisionPricing";

/* =======================================================
   CONFIG
======================================================= */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60;

/* =======================================================
   HELPERS
======================================================= */
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

type BasicRisk = {
  severity?: "info" | "moderate" | "critical";
  label?: string;
};

type NextCheckTone = "critical" | "moderate" | "unsure";

function nextCheckToneStyles(tone: NextCheckTone) {
  if (tone === "critical") {
    return {
      wrap: "border-rose-500/30 bg-rose-500/10",
      icon: "text-rose-300",
      label: "Highest impact",
      why: "Resolving this removes the biggest risk in your decision.",
      after:
        "If this can’t be verified cleanly, walking away becomes the safer option.",
    };
  }

  if (tone === "moderate") {
    return {
      wrap: "border-amber-500/30 bg-amber-500/10",
      icon: "text-amber-300",
      label: "Worth clarifying",
      why: "Clarifying this reduces uncertainty before you commit.",
      after:
        "Once confirmed, your recommended offer range may move closer to the asking price.",
    };
  }

  return {
    wrap: "border-white/15 bg-white/5",
    icon: "text-slate-300",
    label: "Reduce unknowns",
    why: "Confirming this turns an unknown into a known.",
    after:
      "This helps you decide whether to proceed confidently or pause.",
  };
}

export default function InPersonResults() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const scanIdSafe = scanId ? String(scanId) : "";

  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  /* -------------------------------------------------------
     ROUTING SAFETY
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanIdSafe) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [scanIdSafe, navigate]);

  /* -------------------------------------------------------
     PAYWALL / UNLOCK
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function checkUnlock() {
      if (!scanIdSafe) return;

      setCheckingUnlock(true);
      setUnlockError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) navigate("/signin", { replace: true });
          return;
        }

        const reference = `scan:${scanIdSafe}`;

        const { data, error } = await supabase
          .from("credit_ledger")
          .select("id")
          .eq("user_id", user.id)
          .eq("event_type", "in_person_scan_completed")
          .eq("reference", reference)
          .limit(1);

        if (error || !data || data.length === 0) {
          if (!cancelled) {
            navigate(`/scan/in-person/unlock/${scanIdSafe}`, {
              replace: true,
            });
          }
          return;
        }
      } catch {
        if (!cancelled) setUnlockError(RESULTS_COPY.unlockVerifyFailed);
      } finally {
        if (!cancelled) setCheckingUnlock(false);
      }
    }

    void checkUnlock();
    return () => {
      cancelled = true;
    };
  }, [scanIdSafe, navigate]);

  /* -------------------------------------------------------
     LOAD DATA
  ------------------------------------------------------- */
  const saved = useMemo(() => {
    if (!scanIdSafe) return null;
    try {
      return loadScanById(scanIdSafe);
    } catch {
      return null;
    }
  }, [scanIdSafe]);

  const progressFallback = useMemo(() => {
    try {
      return loadProgress();
    } catch {
      return null;
    }
  }, []);

  const progress: any = useMemo(() => {
    return {
      ...(progressFallback ?? {}),
      ...(saved?.progressSnapshot ?? {}),
    };
  }, [saved, progressFallback]);

  /* ---------------- AI INTERPRETATION ---------------- */
  const aiInterpretation: any = (saved as any)?.aiInterpretation ?? null;

  /* -------------------------------------------------------
     ANALYSIS
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    try {
      if (saved?.analysis) return saved.analysis;
      return analyseInPersonInspection(progress);
    } catch {
      return null;
    }
  }, [saved, progress]);

  /* -------------------------------------------------------
     VERDICT
  ------------------------------------------------------- */
  const verdictOutcome = useMemo(
    () => (analysis ? buildVerdictOutcome(analysis) : null),
    [analysis]
  );

  const risks: BasicRisk[] = useMemo(() => {
    const raw = (analysis as any)?.risks;
    return Array.isArray(raw) ? (raw as BasicRisk[]) : [];
  }, [analysis]);

  const riskCounts = useMemo(
    () => countRisksBySeverity(risks as any),
    [risks]
  );

  const uncertaintyFactors = useMemo(
    () => extractUncertaintyFactors(analysis),
    [analysis]
  );

  /* -------------------------------------------------------
     🎯 SINGLE BEST THING TO VERIFY NEXT
  ------------------------------------------------------- */
  const bestNext = useMemo(() => {
    if (!analysis) return null;

    const critical = risks.find((r) => r.severity === "critical");
    if (critical?.label) {
      return {
        text: `Resolve “${critical.label}” with written or photographic evidence.`,
        tone: "critical" as NextCheckTone,
      };
    }

    const moderate = risks.find((r) => r.severity === "moderate");
    if (moderate?.label) {
      return {
        text: `Clarify “${moderate.label}” and confirm it doesn’t indicate a larger issue.`,
        tone: "moderate" as NextCheckTone,
      };
    }

    if (uncertaintyFactors.length > 0) {
      return {
        text:
          "Confirm the most important item you marked as unsure — treat it as unknown until verified.",
        tone: "unsure" as NextCheckTone,
      };
    }

    return {
      text:
        "Ask for the most recent service invoice and confirm service history in writing.",
      tone: "unsure" as NextCheckTone,
    };
  }, [analysis, risks, uncertaintyFactors.length]);

  /* -------------------------------------------------------
     PRICE POSITIONING
  ------------------------------------------------------- */
  const pricingSummary = useMemo(() => {
    if (!analysis) return null;

    const verdict =
      analysis.verdict === "walk-away" ||
      analysis.verdict === "caution" ||
      analysis.verdict === "proceed"
        ? analysis.verdict
        : "caution";

    return buildGuidedPricePositioning({
      askingPrice: progress?.askingPrice ?? null,
      verdict,
      confidenceScore: Number((analysis as any)?.confidenceScore ?? 0),
      criticalCount: riskCounts.critical,
      moderateCount: riskCounts.moderate,
      unsureCount: uncertaintyFactors.length,
    });
  }, [
    analysis,
    progress?.askingPrice,
    riskCounts.critical,
    riskCounts.moderate,
    uncertaintyFactors.length,
  ]);

  /* -------------------------------------------------------
     PHOTOS
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      if (!analysis || checkingUnlock || unlockError) return;

      const { urls } = await resolvePhotoUrls(progress, {
        bucket: PHOTO_BUCKET,
        ttlSeconds: SIGNED_URL_TTL,
      });

      if (!cancelled) {
        setPhotoUrls(urls);
      }
    }

    void loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [analysis, progress, checkingUnlock, unlockError]);

  /* -------------------------------------------------------
     UI GATES
  ------------------------------------------------------- */
  const canRenderReport =
    Boolean(scanIdSafe) &&
    !checkingUnlock &&
    !unlockError &&
    Boolean(verdictOutcome);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
      {canRenderReport && verdictOutcome && (
        <>
          {/* ================= VERDICT ================= */}
          <header className="space-y-3">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {RESULTS_COPY.brandLine}
            </span>

            <h1 className="text-2xl md:text-3xl font-semibold text-white flex items-center gap-3">
              {verdictOutcome.verdict.key === "proceed" && (
                <CheckCircle2 className="text-emerald-400" />
              )}
              {verdictOutcome.verdict.key === "caution" && (
                <AlertTriangle className="text-amber-400" />
              )}
              {verdictOutcome.verdict.key === "walk-away" && (
                <XCircle className="text-rose-400" />
              )}
              {verdictOutcome.verdict.title}
            </h1>

            <p className="text-slate-300 max-w-3xl">
              {verdictOutcome.verdict.posture}
            </p>

            {/* ================= AI INTERPRETATION ================= */}
            {aiInterpretation ? (
              <section className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-5 space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  <h2 className="text-sm font-semibold text-white">
                    Expert interpretation
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-slate-200">
                  <p className="font-semibold text-white">
                    {aiInterpretation?.decisionBrief?.headline}
                  </p>

                  <ul className="list-disc pl-5 space-y-1">
                    {(aiInterpretation?.decisionBrief?.bullets ?? []).map(
                      (b: string, i: number) => (
                        <li key={i}>{b}</li>
                      )
                    )}
                  </ul>

                  {aiInterpretation?.decisionBrief?.nextBestAction && (
                    <p className="text-slate-300">
                      <span className="font-semibold text-white">
                        Next best action:
                      </span>{" "}
                      {aiInterpretation.decisionBrief.nextBestAction}
                    </p>
                  )}
                </div>

                {aiInterpretation?.whyThisVerdict && (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {aiInterpretation.whyThisVerdict}
                  </p>
                )}
              </section>
            ) : (
              <section className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-300" />
                  <p className="font-semibold text-white">
                    Expert interpretation
                  </p>
                </div>
                <p className="mt-2">
                  No AI interpretation has been generated for this report yet.
                </p>
              </section>
            )}
          </header>

          {/* ================= PRINT ================= */}
          <section className="rounded-2xl border border-white/15 bg-slate-900/60 px-5 py-4">
            <button
              onClick={() => navigate(`/scan/in-person/print/${scanIdSafe}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-100"
            >
              <Printer className="h-4 w-4" />
              Print / Save report (PDF)
            </button>
          </section>

          {/* ================= BEST NEXT ================= */}
          {bestNext &&
            (() => {
              const s = nextCheckToneStyles(bestNext.tone);

              return (
                <section
                  className={["rounded-2xl border px-5 py-5 space-y-4", s.wrap].join(
                    " "
                  )}
                >
                  <div className="flex items-center gap-2 text-slate-200">
                    <Flag className={["h-4 w-4", s.icon].join(" ")} />
                    <h2 className="text-sm font-semibold">
                      What will improve your position most
                    </h2>
                  </div>

                  <p className="text-sm text-slate-200">{bestNext.text}</p>

                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 mt-0.5 text-slate-300" />
                      <span className="text-slate-300">{s.why}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-slate-300" />
                      <span className="text-slate-300">{s.after}</span>
                    </div>
                  </div>
                </section>
              );
            })()}

          {/* ================= PRICING ================= */}
          {pricingSummary && (
            <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-200">
                <BadgeDollarSign className="h-4 w-4 text-slate-300" />
                <h2 className="text-sm font-semibold">
                  Price positioning (preview)
                </h2>
              </div>

              {pricingSummary.mode === "ok" && (
                <>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {formatMoney(
                        pricingSummary.bands.find(
                          (b) => b.key === pricingSummary.recommendedKey
                        )?.min
                      )}{" "}
                      –{" "}
                      {formatMoney(
                        pricingSummary.bands.find(
                          (b) => b.key === pricingSummary.recommendedKey
                        )?.max
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {pricingSummary.confidenceNote}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate("/scan/in-person/decision/" + scanIdSafe)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-100"
                  >
                    Open decision & negotiation
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </section>
          )}

          {/* ================= PHOTOS ================= */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-300" />
              Photos
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photoUrls.slice(0, 6).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="rounded-xl border border-white/10 object-cover"
                />
              ))}
            </div>
          </section>

          {/* ================= CTA ================= */}
          <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <h2 className="text-sm font-semibold">Decision & next steps</h2>
            </div>

            <p className="text-sm text-slate-300">
              This brings everything together — risks, uncertainty, and price —
              into calm guidance on how to proceed.
            </p>

            <button
              onClick={() => navigate("/scan/in-person/decision/" + scanIdSafe)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-100"
            >
              Open decision guide
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </>
      )}
    </div>
  );
}
