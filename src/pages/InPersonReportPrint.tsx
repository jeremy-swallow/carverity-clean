import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonReportPrint() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const analysis = useMemo(() => {
    return analyseInPersonInspection(progress);
  }, [progress]);

  const photos: string[] = (progress?.photos ?? []).map(
    (p: any) => p.dataUrl
  );

  const scanId = progress?.scanId ?? "—";

  /* -------------------------------------------------------
     Helpers
  ------------------------------------------------------- */
  function triggerPrint() {
    window.print();
  }

  function backToSummary() {
    navigate("/scan/in-person/summary");
  }

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
    <div className="print-body bg-white text-black min-h-screen">
      <div className="max-w-3xl mx-auto px-10 py-12 space-y-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="space-y-3">
          <h1 className="text-2xl font-bold">
            CarVerity — In-Person Inspection Report
          </h1>

          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>Scan ID:</strong> {scanId}
            </span>
            <span>
              <strong>Date:</strong>{" "}
              {new Date().toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-black/70 max-w-2xl">
            This buyer-side report summarises observations recorded during a
            guided in-person inspection. It is designed to support purchasing
            decisions and discussion — not to replace a mechanical inspection.
          </p>
        </header>

        {/* =====================================================
            VERDICT
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Executive summary
          </h2>

          <p className="text-lg font-semibold">
            {analysis.verdict === "proceed"
              ? "Proceed with confidence"
              : analysis.verdict === "caution"
              ? "Proceed with caution"
              : "High risk — walking away is reasonable"}
          </p>

          <p className="text-sm text-black/80">
            {analysis.verdictReason}
          </p>

          <div className="flex gap-6 pt-2 text-sm">
            <span>
              <strong>Confidence:</strong>{" "}
              {analysis.confidenceScore}%
            </span>
            <span>
              <strong>Coverage:</strong>{" "}
              {analysis.completenessScore}%
            </span>
          </div>
        </section>

        {/* =====================================================
            EVIDENCE
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Inspection evidence
          </h2>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Inspection photo ${i + 1}`}
                  className="border border-black/20 object-cover aspect-square"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/70">
              No photos were recorded during this inspection.
            </p>
          )}

          <p className="text-xs text-black/60">
            This assessment is limited to what was captured at the time of
            inspection. Areas not photographed may still warrant follow-up.
          </p>
        </section>

        {/* =====================================================
            PRIORITY FINDINGS
        ===================================================== */}
        {priorityRisks.length > 0 && (
          <section className="border border-black/20 px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Priority findings
            </h2>

            <ul className="list-disc list-inside space-y-1 text-sm">
              {priorityRisks.map((r) => (
                <li key={r.id}>
                  <strong>{r.label}:</strong> {r.explanation}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* =====================================================
            WORTH CLARIFYING
        ===================================================== */}
        {moderateRisks.length > 0 && (
          <section className="border border-black/20 px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Worth clarifying
            </h2>

            <ul className="list-disc list-inside space-y-1 text-sm">
              {moderateRisks.map((r) => (
                <li key={r.id}>
                  <strong>{r.label}:</strong> {r.explanation}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* =====================================================
            DISCLAIMER
        ===================================================== */}
        <div className="border border-black/20 bg-black/5 px-5 py-4 text-xs">
          This document is not a mechanical inspection, defect report, or
          valuation. It reflects observations recorded during a guided
          walkthrough and should be used alongside professional inspections
          and independent checks.
        </div>

        {/* =====================================================
            ACTIONS (NO PRINT)
        ===================================================== */}
        <div className="no-print flex gap-3 pt-6">
          <button
            onClick={triggerPrint}
            className="px-4 py-2 rounded bg-black text-white font-semibold"
          >
            Print / Save as PDF
          </button>

          <button
            onClick={backToSummary}
            className="px-4 py-2 rounded border border-black/30"
          >
            Back to summary
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
