// src/pages/InPersonResults.tsx

import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Camera,
  ClipboardList,
  ShieldCheck,
  FileText,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const progress: any = loadProgress();
  const scanId =
    params.get("scanId") || progress?.scanId || "";

  /* -------------------------------------------------------
     Routing safety
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    if (!isScanUnlocked(scanId)) {
      navigate(`/scan/in-person/preview?scanId=${encodeURIComponent(scanId)}`, {
        replace: true,
      });
    }
  }, [scanId, navigate]);

  if (!scanId || !isScanUnlocked(scanId)) return null;

  /* -------------------------------------------------------
     Analysis
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    return analyseInPersonInspection(progress);
  }, [progress]);

  const photos: string[] = (progress?.photos ?? []).map(
    (p: any) => p.dataUrl
  );

  /* -------------------------------------------------------
     Verdict meta
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: "Proceed with confidence",
      tone: "border-emerald-500/40 bg-emerald-500/10",
    },
    caution: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Proceed — but clarify a few things",
      tone: "border-amber-500/40 bg-amber-500/10",
    },
    "walk-away": {
      icon: <XCircle className="h-6 w-6 text-red-400" />,
      title: "High risk — walking away is reasonable",
      tone: "border-red-500/40 bg-red-500/10",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Derived groupings
  ------------------------------------------------------- */
  const priorityRisks = analysis.risks.filter(
    (r) => r.severity === "critical"
  );

  const moderateRisks = analysis.risks.filter(
    (r) => r.severity === "moderate"
  );

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */
  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">
      {/* =====================================================
          01 — REPORT HEADER
      ===================================================== */}
      <section className="space-y-3">
        <span className="text-[11px] uppercase tracking-widest text-slate-400">
          CarVerity buyer-side inspection report
        </span>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          <span>Scan ID: {scanId}</span>
          <span>
            Generated: {new Date().toLocaleDateString()}
          </span>
        </div>
      </section>

      {/* =====================================================
          02 — EXECUTIVE SUMMARY
      ===================================================== */}
      <section
        className={`rounded-2xl border px-6 py-6 space-y-4 ${verdictMeta.tone}`}
      >
        <div className="flex items-start gap-3">
          {verdictMeta.icon}
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {verdictMeta.title}
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              {analysis.verdictReason}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4">
          <div>
            <div className="flex items-center gap-2 text-slate-300">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Coverage</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — EVIDENCE & COVERAGE
      ===================================================== */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-slate-300">
          <Camera className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">
            Inspection evidence
          </h2>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Inspection photo ${i + 1}`}
                className="rounded-xl border border-white/10 object-cover aspect-square"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No photos were captured during this inspection.
          </p>
        )}

        <p className="text-xs text-slate-400 max-w-2xl">
          This assessment is limited to what was recorded during the
          inspection. Areas not photographed may still warrant follow-up.
        </p>
      </section>

      {/* =====================================================
          04 — PRIORITY FINDINGS
      ===================================================== */}
      {priorityRisks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ClipboardList className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold">
              Priority findings
            </h2>
          </div>

          {priorityRisks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/60 px-5 py-4"
            >
              <p className="text-sm font-semibold text-white">
                {r.label}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* =====================================================
          05 — WORTH CLARIFYING
      ===================================================== */}
      {moderateRisks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold">
              Worth clarifying
            </h2>
          </div>

          {moderateRisks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/60 px-5 py-4"
            >
              <p className="text-sm font-medium text-slate-200">
                {r.label}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* =====================================================
          06 — WHAT LOOKED OK
      ===================================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">
          What appeared normal from what was recorded
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl">
          Based on the evidence captured, no obvious high-risk mechanical
          or safety issues were observed. This does not replace a
          professional inspection.
        </p>
      </section>

      {/* =====================================================
          07 — NEXT BEST ACTIONS
      ===================================================== */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">
          Suggested next steps
        </h2>

        <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
          <li>Confirm documented service history</li>
          <li>Pay attention to cold-start behaviour</li>
          <li>Consider a professional inspection if concerns remain</li>
        </ul>
      </section>

      {/* =====================================================
          08 — ACTIONS
      ===================================================== */}
      <section className="space-y-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4"
        >
          View buyer-safe negotiation guidance
        </button>

        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
