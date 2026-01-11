// src/pages/InPersonReportPrint.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

export default function InPersonReportPrint() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const analysis = analyseInPersonInspection(progress);

  const hasOnlineScan =
    localStorage.getItem("carverity_online_completed") === "1";
  const dualJourneyComplete = hasOnlineScan;

  const imperfections = progress?.imperfections ?? [];
  const listingUrl = localStorage.getItem("carverity_listing_url") || "";

  /* =========================================================
     Derived sections
  ========================================================== */

  const clarificationItems = useMemo(() => {
    return analysis.risks
      .filter((r) => r.severity !== "info")
      .map((r) => r.label);
  }, [analysis.risks]);

  /* =========================================================
     Helpers
  ========================================================== */

  function triggerPrint() {
    window.print();
  }

  function backToSummary() {
    navigate("/scan/in-person/summary");
  }

  function fmt(aud: number) {
    return `$${aud.toLocaleString()}`;
  }

  const { conservative, balanced, aggressive } =
    analysis.negotiationPositioning;

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="print-body bg-white text-black min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-2xl font-bold">
            CarVerity — In-Person Inspection Summary
          </h1>

          {listingUrl && (
            <p className="text-sm">
              Listing reference: <span className="underline">{listingUrl}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              <strong>Verdict:</strong>{" "}
              {analysis.verdict === "proceed"
                ? "Proceed with confidence"
                : analysis.verdict === "caution"
                ? "Proceed with caution"
                : "High risk — walk-away reasonable"}
            </span>
            <span>
              <strong>Confidence:</strong> {analysis.confidenceScore}%
            </span>
            <span>
              <strong>Coverage:</strong> {analysis.completenessScore}%
            </span>
          </div>

          {dualJourneyComplete && (
            <div className="border border-black/20 bg-black/5 px-4 py-2 text-sm">
              ✓ Dual-scan complete (online + in-person insights combined)
            </div>
          )}
        </header>

        {/* Explanation */}
        <ReportSection title="Why this verdict">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {analysis.whyThisVerdict.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </ReportSection>

        {/* Negotiation */}
        <ReportSection title="Negotiation positioning (context only)">
          <p className="text-sm mb-3">
            These figures represent a reasonable negotiation allowance based on
            recorded observations. They are not a valuation or repair quote.
          </p>

          <ul className="space-y-2 text-sm">
            <li>
              <strong>Conservative:</strong>{" "}
              {fmt(conservative.audLow)}–{fmt(conservative.audHigh)}
            </li>
            <li>
              <strong>Balanced:</strong>{" "}
              {fmt(balanced.audLow)}–{fmt(balanced.audHigh)}
            </li>
            <li>
              <strong>Aggressive:</strong>{" "}
              {fmt(aggressive.audLow)}–{fmt(aggressive.audHigh)}
            </li>
          </ul>
        </ReportSection>

        {/* Clarifications */}
        {clarificationItems.length > 0 && (
          <ReportSection title="Items worth clarifying with the seller">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {clarificationItems.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* Observations */}
        {imperfections.length > 0 && (
          <ReportSection title="Recorded observations & notes">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {imperfections.map((i: any) => (
                <li key={i.id}>
                  {i.label}
                  {i.location ? ` (${i.location})` : ""}
                  {i.note ? ` — ${i.note}` : ""}
                </li>
              ))}
            </ul>
          </ReportSection>
        )}

        {/* Disclaimer */}
        <div className="border border-black/20 bg-black/5 px-4 py-3 text-xs">
          This summary is not a mechanical inspection or defect certificate. It
          reflects observations recorded during a guided in-person walkthrough
          and is intended to support buyer decision-making and discussion.
        </div>

        {/* Actions */}
        <div className="no-print flex gap-3 pt-4">
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

/* =========================================================
   Reusable section block
========================================================= */
function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-black/20 px-5 py-4 space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}
