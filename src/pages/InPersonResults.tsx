// src/pages/InPersonResults.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Handshake,
} from "lucide-react";

import { loadProgress, saveProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import {
  analyseInPersonInspection,
  type ScanProgress,
} from "../utils/inPersonAnalysis";

const UNLOCK_KEY_PREFIX = "carverity_inperson_unlocked_";

function localUnlock(scanId: string) {
  try {
    localStorage.setItem(`${UNLOCK_KEY_PREFIX}${scanId}`, "1");
  } catch {
    // ignore
  }
}

function localIsUnlocked(scanId: string) {
  try {
    return localStorage.getItem(`${UNLOCK_KEY_PREFIX}${scanId}`) === "1";
  } catch {
    return false;
  }
}

export default function InPersonResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlScanId = searchParams.get("scanId") || "";
  const sessionId = searchParams.get("session_id") || "";

  const [progress, setProgress] = useState<ScanProgress>(() => {
    return (loadProgress() ?? {}) as ScanProgress;
  });

  // Re-load once on mount (handles edge cases where storage updates late)
  useEffect(() => {
    setProgress(((loadProgress() ?? {}) as ScanProgress) ?? {});
  }, []);

  const effectiveScanId = urlScanId || progress?.scanId || "";

  /* -------------------------------------------------------
     Repair missing scanId after Stripe redirect:
     - URL has scanId
     - local progress may be empty/mismatched
  ------------------------------------------------------- */
  useEffect(() => {
    if (!urlScanId) return;

    if (!progress || progress.scanId !== urlScanId) {
      const next: ScanProgress = {
        ...(progress ?? {}),
        type: "in-person",
        scanId: urlScanId,
        step: "/scan/in-person/results",
      };
      saveProgress(next as any);
      setProgress(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlScanId]);

  /* -------------------------------------------------------
     Stripe success redirect → mark locally unlocked
     and clean session_id from URL
  ------------------------------------------------------- */
  useEffect(() => {
    if (effectiveScanId && sessionId) {
      localUnlock(effectiveScanId);

      const clean = `/scan/in-person/results?scanId=${encodeURIComponent(
        effectiveScanId
      )}`;
      window.history.replaceState({}, "", clean);
    }
  }, [effectiveScanId, sessionId]);

  /* -------------------------------------------------------
     Safety: no scan → restart
  ------------------------------------------------------- */
  useEffect(() => {
    if (!effectiveScanId) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [effectiveScanId, navigate]);

  /* -------------------------------------------------------
     Lock enforcement
  ------------------------------------------------------- */
  const unlocked =
    (effectiveScanId ? isScanUnlocked(effectiveScanId) : false) ||
    (effectiveScanId ? localIsUnlocked(effectiveScanId) : false);

  useEffect(() => {
    if (effectiveScanId && !unlocked) {
      navigate("/scan/in-person/preview", { replace: true });
    }
  }, [effectiveScanId, unlocked, navigate]);

  // Hard stop for render if scan missing / locked
  if (!effectiveScanId) return null;
  if (!unlocked) return null;

  const analysis = useMemo(() => {
    const safe: ScanProgress = (progress ?? {}) as ScanProgress;
    // Ensure scanId exists for analysis context
    const enriched: ScanProgress = { ...safe, scanId: effectiveScanId };
    return analyseInPersonInspection(enriched);
  }, [progress, effectiveScanId]);

  const verdictIcon =
    analysis.verdict === "proceed" ? (
      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
    ) : analysis.verdict === "caution" ? (
      <AlertTriangle className="h-6 w-6 text-amber-400" />
    ) : (
      <XCircle className="h-6 w-6 text-red-400" />
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan results
      </span>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          {verdictIcon}
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            {analysis.verdict === "proceed" &&
              "Proceed — no major red flags detected"}
            {analysis.verdict === "caution" &&
              "Proceed carefully — a few items need clarification"}
            {analysis.verdict === "walk-away" &&
              "High concern — walking away may be safest"}
          </h1>
        </div>

        <p className="text-sm text-slate-300 max-w-xl">
          {analysis.verdictReason}
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium">Inspection signals</span>
        </div>

        <div className="flex gap-10">
          <div>
            <p className="text-[11px] uppercase text-slate-400">Confidence</p>
            <p className="text-lg font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Inspection coverage
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>

        {/* Hidden inference exists in analysis output (no new UI requested).
            If you later want to use it in report/negotiation, it's available:
            analysis.inferredSignals.adasPresentButDisabled */}
      </section>

      {analysis.risks.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Key items worth understanding
            </h2>
          </div>

          {analysis.risks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/50 px-5 py-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-200 font-medium">{r.label}</p>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {r.severity}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{r.explanation}</p>
            </div>
          ))}
        </section>
      ) : (
        <section className="rounded-2xl bg-slate-900/40 px-6 py-5 border border-white/10">
          <p className="text-sm text-slate-200 font-medium">
            No major risks were flagged from what was recorded.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            If you skipped checks or didn’t capture the baseline exterior photos,
            increase coverage to improve reliability.
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="w-full rounded-xl border border-white/20 text-slate-200 font-semibold px-5 py-3"
        >
          View printable report
        </button>

        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3 flex items-center justify-center gap-2"
        >
          <Handshake className="h-4 w-4" />
          View negotiation guidance
        </button>
      </div>
    </div>
  );
}
