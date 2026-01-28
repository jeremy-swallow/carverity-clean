// src/pages/InPersonResults.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ClipboardCheck,
  ArrowRight,
  RotateCcw,
  Printer,
  BadgeDollarSign,
} from "lucide-react";

import { supabase } from "../supabaseClient";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

import { resolvePhotoUrls } from "./inPersonResults/photoLogic";
import {
  buildVerdictOutcome,
  countRisksBySeverity,
  type VerdictOutcome,
} from "./inPersonResults/verdictLogic";
import {
  extractFlaggedChecks,
  sanitiseImperfections,
  extractUncertaintyFactors,
  extractEvidenceSummary,
  buildNextSteps,
  buildClarifyQuestions,
  type FlaggedCheck,
  type CleanImperfection,
} from "./inPersonResults/evidenceLogic";
import {
  RESULTS_COPY,
  scoreBlurbCopy,
  buildEvidenceHeadlineCopy,
  buildEvidenceNotesCopy,
} from "./inPersonResults/copy";

/* =======================================================
   CONFIG
======================================================= */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60;

/* =======================================================
   PRESENTATION HELPERS
======================================================= */
function Paragraph({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl">
      {String(value)}
    </p>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc list-inside space-y-2 text-[15px] text-slate-300">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

/* =======================================================
   PAGE
======================================================= */
export default function InPersonResults() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const scanIdSafe = scanId ? String(scanId) : "";

  const [checkingUnlock, setCheckingUnlock] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [capturedPhotoCount, setCapturedPhotoCount] = useState(0);

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
        if (!cancelled) {
          setUnlockError(RESULTS_COPY.unlockVerifyFailed);
        }
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
    const base = (saved?.progressSnapshot ?? {}) as any;
    const fallback = (progressFallback ?? {}) as any;

    return {
      ...fallback,
      ...base,
      photos:
        Array.isArray(base?.photos) && base.photos.length >=
        (fallback?.photos?.length ?? 0)
          ? base.photos
          : fallback?.photos,
      followUpPhotos:
        Array.isArray(base?.followUpPhotos) &&
        base.followUpPhotos.length >=
          (fallback?.followUpPhotos?.length ?? 0)
          ? base.followUpPhotos
          : fallback?.followUpPhotos,
    };
  }, [saved, progressFallback]);

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

  useEffect(() => {
    if (!scanIdSafe || checkingUnlock || unlockError) return;
    if (!analysis) {
      navigate(`/scan/in-person/analyzing/${scanIdSafe}`, { replace: true });
    }
  }, [analysis, scanIdSafe, checkingUnlock, unlockError, navigate]);

  /* -------------------------------------------------------
     DERIVED DATA
  ------------------------------------------------------- */
  const verdictOutcome: VerdictOutcome | null = useMemo(
    () => (analysis ? buildVerdictOutcome(analysis) : null),
    [analysis]
  );

  const riskCounts = useMemo(
    () => countRisksBySeverity((analysis as any)?.risks ?? []),
    [analysis]
  );

  const flaggedChecks: FlaggedCheck[] = useMemo(
    () => extractFlaggedChecks(progress),
    [progress]
  );

  const imperfections: CleanImperfection[] = useMemo(
    () => sanitiseImperfections(progress?.imperfections ?? []),
    [progress]
  );

  const uncertaintyFactors = useMemo(
    () => extractUncertaintyFactors(analysis),
    [analysis]
  );

  const evidenceSummary = useMemo(
    () => extractEvidenceSummary(analysis),
    [analysis]
  );

  const nextSteps = useMemo(
    () =>
      buildNextSteps({
        driveWasDone: true,
        criticalCount: riskCounts.critical,
        moderateCount: riskCounts.moderate,
        unsureCount: uncertaintyFactors.length,
      }),
    [riskCounts, uncertaintyFactors.length]
  );

  const clarifyQuestions = useMemo(
    () =>
      buildClarifyQuestions({
        criticalRisks:
          (analysis as any)?.risks?.filter(
            (r: any) => r?.severity === "critical"
          ) ?? [],
        moderateRisks:
          (analysis as any)?.risks?.filter(
            (r: any) => r?.severity === "moderate"
          ) ?? [],
        unsureCount: uncertaintyFactors.length,
      }),
    [analysis, uncertaintyFactors.length]
  );

  /* -------------------------------------------------------
     PHOTOS
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      if (!analysis || checkingUnlock || unlockError) return;

      const { urls, capturedCount } = await resolvePhotoUrls(progress, {
        bucket: PHOTO_BUCKET,
        ttlSeconds: SIGNED_URL_TTL,
      });

      if (!cancelled) {
        setPhotoUrls(urls);
        setCapturedPhotoCount(capturedCount);
      }
    }

    void loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [analysis, progress, checkingUnlock, unlockError]);

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  if (!verdictOutcome || checkingUnlock) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-sm text-slate-400">
          {RESULTS_COPY.verifyingUnlock}
        </p>
      </div>
    );
  }

  const toneBg =
    verdictOutcome.verdict.tone === "emerald"
      ? "bg-emerald-500/10"
      : verdictOutcome.verdict.tone === "amber"
      ? "bg-amber-500/10"
      : "bg-red-500/10";

  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
      {/* ================= VERDICT ================= */}
      <section className={`rounded-2xl p-8 ${toneBg} space-y-4`}>
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          {RESULTS_COPY.brandLine}
        </span>

        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          {verdictOutcome.verdict.tone === "emerald" && (
            <CheckCircle2 className="text-emerald-400" />
          )}
          {verdictOutcome.verdict.tone === "amber" && (
            <AlertTriangle className="text-amber-400" />
          )}
          {verdictOutcome.verdict.tone === "red" && (
            <XCircle className="text-red-400" />
          )}
          {verdictOutcome.verdict.title}
        </h1>

        <Paragraph value={verdictOutcome.verdict.posture} />
        <Paragraph value={scoreBlurbCopy(verdictOutcome.scores)} />
      </section>

      {/* ================= AT A GLANCE ================= */}
      {verdictOutcome.signals.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white">
            What stood out at a glance
          </h2>
          <BulletList
            items={verdictOutcome.signals.map((s) => s.label)}
          />
        </section>
      )}

      {/* ================= EVIDENCE ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ClipboardCheck />
          Evidence considered
        </h2>

        <Paragraph value={evidenceSummary.text} />
        <BulletList items={evidenceSummary.bullets} />

        <div className="pt-2">
          <Paragraph
            value={buildEvidenceHeadlineCopy({
              concernCount: flaggedChecks.length,
              imperfectionCount: imperfections.length,
              capturedPhotoCount,
            })}
          />
          <BulletList
            items={buildEvidenceNotesCopy({
              hasUnsure: uncertaintyFactors.length > 0,
            })}
          />
        </div>
      </section>

      {/* ================= NEXT STEPS ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <BadgeDollarSign />
          {RESULTS_COPY.nextTitle}
        </h2>
        <Paragraph value={RESULTS_COPY.nextIntro} />
        <BulletList items={nextSteps} />
      </section>

      {/* ================= QUESTIONS ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          {RESULTS_COPY.questionsTitle}
        </h2>
        <Paragraph value={RESULTS_COPY.questionsIntro} />
        <BulletList items={clarifyQuestions} />
      </section>

      {/* ================= PHOTOS ================= */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Camera />
          {RESULTS_COPY.photosTitle}
        </h2>

        {photoUrls.length === 0 && (
          <Paragraph value={RESULTS_COPY.photosNone} />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photoUrls.map((u) => (
            <img
              key={u}
              src={u}
              alt=""
              className="rounded-xl border border-slate-700"
            />
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="pt-12 flex flex-wrap gap-3">
        <button className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm text-white">
          <Printer /> {RESULTS_COPY.bottomPrint}
        </button>
        <button
          onClick={() => navigate("/scan/in-person/start")}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white"
        >
          <RotateCcw /> {RESULTS_COPY.bottomNewScan}
        </button>
        <button
          onClick={() => navigate("/my-scans")}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-black ml-auto"
        >
          <ArrowRight /> {RESULTS_COPY.bottomDecision}
        </button>
      </footer>
    </div>
  );
}
