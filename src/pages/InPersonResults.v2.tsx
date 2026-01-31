// src/pages/InPersonResults.v2.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ArrowRight,
  BadgeDollarSign,
  Flag,
  Info,
  Printer,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById, saveScan } from "../utils/scanStorage";

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
    return `$${Math.round(Number(n) || 0)}`;
  }
}

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? p?.vehicle?.year ?? "";
  const make = p?.vehicleMake ?? p?.vehicle?.make ?? "";
  const model = p?.vehicleModel ?? p?.vehicle?.model ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "In-person inspection";
}

/**
 * Remove heavy fields before sending to API.
 * IMPORTANT: In this app, photos use `storagePath` (not base64).
 * We keep storagePath, and drop anything else.
 */
function stripHeavyFields(progress: any) {
  const p = { ...(progress ?? {}) };

  if (Array.isArray(p.photos)) {
    p.photos = p.photos.map((ph: any) => ({
      id: ph?.id,
      stepId: ph?.stepId,
      storagePath: ph?.storagePath,
    }));
  }

  if (Array.isArray(p.followUpPhotos)) {
    p.followUpPhotos = p.followUpPhotos.map((ph: any) => ({
      id: ph?.id,
      note: ph?.note,
      storagePath: ph?.storagePath,
    }));
  }

  return p;
}

async function postJsonAuthed<T>(
  url: string,
  body: any,
  accessToken: string
): Promise<{ ok: boolean; status: number; json: T | null }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body ?? {}),
    });

    const status = res.status;

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // ignore
    }

    return { ok: res.ok, status, json };
  } catch (err) {
    console.error("[InPersonResults.v2] postJsonAuthed failed:", url, err);
    return { ok: false, status: 0, json: null };
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
      why: "Resolving this removes the biggest risk in your decision.",
      after:
        "If this can’t be verified cleanly, walking away becomes the safer option.",
    };
  }

  if (tone === "moderate") {
    return {
      wrap: "border-amber-500/30 bg-amber-500/10",
      icon: "text-amber-300",
      why: "Clarifying this reduces uncertainty before you commit.",
      after:
        "Once confirmed, your recommended offer range may move closer to the asking price.",
    };
  }

  return {
    wrap: "border-white/15 bg-white/5",
    icon: "text-slate-300",
    why: "Confirming this turns an unknown into a known.",
    after: "This helps you decide whether to proceed confidently or pause.",
  };
}

export default function InPersonResultsV2() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const scanIdSafe = scanId ? String(scanId) : "";

  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  // Trigger re-load of saved scan after we persist AI
  const [reloadTick, setReloadTick] = useState(0);

  // AI auto-generation status
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenError, setAiGenError] = useState<string | null>(null);
  const aiAttemptedRef = useRef(false);

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
            navigate(`/scan/in-person/unlock/${scanIdSafe}`, { replace: true });
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
  }, [scanIdSafe, reloadTick]);

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

  /* ---------------- AI INTERPRETATION ----------------
     Stored as an extra property in localStorage (kept via `normaliseInspections` spread).
  --------------------------------------------------- */
  const aiInterpretation: any =
    (saved as any)?.aiInterpretation ??
    (saved as any)?.ai ??
    (saved as any)?.ai_interpretation ??
    null;

  /* -------------------------------------------------------
     ANALYSIS
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    try {
      if ((saved as any)?.analysis) return (saved as any).analysis;
      return analyseInPersonInspection(progress);
    } catch {
      return null;
    }
  }, [saved, progress]);

  /* -------------------------------------------------------
     AUTO-GENERATE AI IF MISSING
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function ensureAI() {
      if (!scanIdSafe) return;
      if (checkingUnlock || unlockError) return;
      if (!analysis) return;

      // If already present, do nothing
      if (aiInterpretation) return;

      // Only attempt once per page load to avoid loops
      if (aiAttemptedRef.current) return;
      aiAttemptedRef.current = true;

      setAiGenerating(true);
      setAiGenError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const latestProgress: any = progress ?? {};
        const accessToken = session.access_token;

        const concernsCount = Array.isArray((analysis as any)?.risks)
          ? (analysis as any).risks.filter((r: any) => r?.severity !== "info")
              .length
          : 0;

        const unsureCount = Array.isArray((analysis as any)?.uncertaintyFactors)
          ? (analysis as any).uncertaintyFactors.length
          : 0;

        const imperfectionsCount = Array.isArray(latestProgress?.imperfections)
          ? latestProgress.imperfections.length
          : 0;

        const photosCount = Array.isArray(latestProgress?.photos)
          ? latestProgress.photos.length
          : 0;

        const aiResp = await postJsonAuthed<any>(
          "/api/analyze-in-person",
          {
            scanId: scanIdSafe,
            progress: stripHeavyFields(latestProgress),
            analysis,
            summary: {
              concernsCount,
              unsureCount,
              imperfectionsCount,
              photosCount,
            },
          },
          accessToken
        );

        const ai =
          aiResp.ok && aiResp.json ? (aiResp.json as any).ai : null;

        if (!ai) {
          if (!cancelled) {
            setAiGenError(
              aiResp.status === 401 || aiResp.status === 403
                ? "AI interpretation could not be generated (auth)."
                : "AI interpretation could not be generated."
            );
          }
          return;
        }

        // Save to local scan (SavedInspection type doesn't include aiInterpretation,
        // but scanStorage keeps unknown fields via JSON + spread normalisation.
        const existing: any = saved ?? null;

        const nextSaved: any = {
          ...(existing ?? {}),
          id: scanIdSafe,
          type: "in-person",
          title: existing?.title ?? vehicleTitleFromProgress(latestProgress),
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          completed: true,

          // Helpful summary metrics for MyScans
          askingPrice:
            typeof latestProgress?.askingPrice === "number"
              ? latestProgress.askingPrice
              : existing?.askingPrice ?? null,
          score: Number((analysis as any)?.confidenceScore ?? existing?.score ?? 0) || null,
          concerns: concernsCount,
          unsure: unsureCount,
          imperfectionsCount,
          photosCount,

          // Persisted reload-safe data
          analysis: existing?.analysis ?? analysis,
          progressSnapshot: existing?.progressSnapshot ?? stripHeavyFields(latestProgress),

          // Extra field (for Results display)
          aiInterpretation: ai,
        };

        await saveScan(nextSaved);

        if (!cancelled) setReloadTick((n) => n + 1);
      } catch (err) {
        console.error("[InPersonResults.v2] ensureAI failed:", err);
        if (!cancelled) setAiGenError("AI interpretation failed to generate.");
      } finally {
        if (!cancelled) setAiGenerating(false);
      }
    }

    void ensureAI();

    return () => {
      cancelled = true;
    };
  }, [
    scanIdSafe,
    checkingUnlock,
    unlockError,
    analysis,
    progress,
    aiInterpretation,
    saved,
  ]);

  /* -------------------------------------------------------
     VERDICT + COUNTS
  ------------------------------------------------------- */
  const verdictOutcome = useMemo(
    () => (analysis ? buildVerdictOutcome(analysis) : null),
    [analysis]
  );

  const risks: BasicRisk[] = useMemo(() => {
    const raw = (analysis as any)?.risks;
    return Array.isArray(raw) ? (raw as BasicRisk[]) : [];
  }, [analysis]);

  const riskCounts = useMemo(() => countRisksBySeverity(risks as any), [risks]);

  const uncertaintyFactors = useMemo(
    () => extractUncertaintyFactors(analysis),
    [analysis]
  );

  /* -------------------------------------------------------
     BEST NEXT
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
      (analysis as any).verdict === "walk-away" ||
      (analysis as any).verdict === "caution" ||
      (analysis as any).verdict === "proceed"
        ? (analysis as any).verdict
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

      if (!cancelled) setPhotoUrls(urls);
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

                {aiGenerating ? (
                  <p className="mt-2 text-slate-300">
                    Generating AI interpretation…
                  </p>
                ) : aiGenError ? (
                  <p className="mt-2 text-rose-300">{aiGenError}</p>
                ) : (
                  <p className="mt-2">
                    No AI interpretation has been generated for this report yet.
                  </p>
                )}
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
                  className={[
                    "rounded-2xl border px-5 py-5 space-y-4",
                    s.wrap,
                  ].join(" ")}
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

              {pricingSummary.mode === "needs_price" ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-white">
                    {pricingSummary.title}
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                    {pricingSummary.guidance.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400">
                    {pricingSummary.disclaimer}
                  </p>
                </div>
              ) : (
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
