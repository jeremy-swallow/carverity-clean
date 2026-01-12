// src/pages/InPersonReportPrint.tsx

import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

/* -------------------------------------------------------
   Small helpers (print-safe, no JSX namespace)
------------------------------------------------------- */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asCleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function renderParagraph(value: unknown): ReactNode {
  const t = asCleanText(value);
  if (!t) return null;
  return <p className="text-sm text-black/80 whitespace-pre-line">{t}</p>;
}

function renderStringList(items: string[]): ReactNode {
  return (
    <ul className="list-disc list-inside space-y-1 text-sm">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function renderEvidenceSummary(evidenceSummary: unknown): ReactNode {
  if (typeof evidenceSummary === "string") {
    return renderParagraph(evidenceSummary);
  }

  if (Array.isArray(evidenceSummary)) {
    const strings = evidenceSummary.map(asCleanText).filter(Boolean);
    if (strings.length > 0) return renderStringList(strings);
  }

  if (isRecord(evidenceSummary)) {
    const candidateKeys = [
      "bullets",
      "bulletPoints",
      "points",
      "items",
      "highlights",
      "summary",
      "text",
      "notes",
    ];

    for (const key of candidateKeys) {
      const v = evidenceSummary[key];
      if (typeof v === "string" && v.trim()) return renderParagraph(v);
      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return renderStringList(strings);
      }
    }

    const flattened: string[] = [];
    Object.entries(evidenceSummary).forEach(([k, v]) => {
      const t = asCleanText(v);
      if (t) flattened.push(`${k}: ${t}`);
    });
    if (flattened.length > 0) return renderStringList(flattened);
  }

  return (
    <p className="text-sm text-black/70">
      Evidence was recorded during the inspection but could not be summarised
      into text.
    </p>
  );
}

function uncertaintyToText(u: unknown): string {
  if (typeof u === "string") return u;

  if (isRecord(u)) {
    const candidates = [
      u.label,
      u.title,
      u.name,
      u.factor,
      u.description,
      u.message,
      u.text,
      u.reason,
    ]
      .map(asCleanText)
      .filter(Boolean);

    if (candidates.length > 0) return candidates[0];
  }

  return "An item was marked as unsure by the buyer.";
}

function rangeToText(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number")
    return `$${value.toLocaleString("en-AU")}`;

  if (Array.isArray(value)) {
    const nums = value.filter(
      (x): x is number => typeof x === "number"
    );
    if (nums.length >= 2) {
      const lo = Math.min(nums[0], nums[1]);
      const hi = Math.max(nums[0], nums[1]);
      return `$${lo.toLocaleString("en-AU")}–$${hi.toLocaleString(
        "en-AU"
      )}`;
    }
  }

  if (isRecord(value)) {
    const min =
      (typeof value.min === "number" && value.min) ||
      (typeof value.low === "number" && value.low) ||
      (typeof value.from === "number" && value.from) ||
      null;

    const max =
      (typeof value.max === "number" && value.max) ||
      (typeof value.high === "number" && value.high) ||
      (typeof value.to === "number" && value.to) ||
      null;

    if (min != null && max != null) {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return `$${lo.toLocaleString("en-AU")}–$${hi.toLocaleString(
        "en-AU"
      )}`;
    }

    const text =
      asCleanText(value.text) ||
      asCleanText(value.summary) ||
      asCleanText(value.display) ||
      "";

    if (text) return text;
  }

  return "";
}

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

  const priorityRisks = analysis.risks.filter(
    (r) => r.severity === "critical"
  );

  const moderateRisks = analysis.risks.filter(
    (r) => r.severity === "moderate"
  );

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const negotiation = (analysis as any).negotiationPositioning ?? {};
  const conservativeRange = rangeToText(negotiation.conservative);
  const assertiveRange = rangeToText(
    negotiation.assertive ??
      negotiation.aggressive ??
      negotiation.strong ??
      negotiation.firm
  );

  function triggerPrint() {
    window.print();
  }

  function backToSummary() {
    navigate("/scan/in-person/summary");
  }

  return (
    <div className="print-body bg-white text-black min-h-screen">
      <div className="max-w-3xl mx-auto px-10 py-12 space-y-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="space-y-3">
          <h1 className="text-2xl font-bold">
            CarVerity — In-Person Buyer Inspection Report
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
            This report summarises what was recorded during a guided,
            buyer-performed in-person inspection. It reflects observed evidence
            and buyer-marked uncertainty only. It does not assume unobserved
            conditions.
          </p>
        </header>

        {/* =====================================================
            EXECUTIVE VERDICT
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Executive verdict
          </h2>

          <p className="text-lg font-semibold">
            {analysis.verdict === "proceed"
              ? "Proceed with confidence"
              : analysis.verdict === "caution"
              ? "Proceed — with targeted clarification"
              : "Risk appears elevated — walking away is reasonable"}
          </p>

          {renderParagraph(
            (analysis as any).whyThisVerdict ||
              (analysis as any).verdictReason
          )}

          <div className="flex gap-6 pt-2 text-sm">
            <span>
              <strong>Confidence:</strong> {analysis.confidenceScore}%
            </span>
            <span>
              <strong>Coverage:</strong> {analysis.completenessScore}%
            </span>
          </div>
        </section>

        {/* =====================================================
            EVIDENCE BASIS
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Evidence considered
          </h2>

          {renderEvidenceSummary((analysis as any).evidenceSummary)}

          <p className="text-xs text-black/60">
            Only evidence you recorded and items you explicitly marked as unsure
            are used. Missing checks are treated as not recorded, not as risk.
          </p>
        </section>

        {/* =====================================================
            PHOTO EVIDENCE
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Photo evidence
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
              No photos were captured during this inspection.
            </p>
          )}
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
            ITEMS WORTH CLARIFYING
        ===================================================== */}
        {moderateRisks.length > 0 && (
          <section className="border border-black/20 px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Items worth clarifying
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
            DECLARED UNCERTAINTY
        ===================================================== */}
        {uncertaintyFactors.length > 0 && (
          <section className="border border-black/20 px-6 py-5 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Buyer-declared uncertainty
            </h2>

            <ul className="list-disc list-inside space-y-1 text-sm">
              {uncertaintyFactors.map((u, i) => (
                <li key={i}>{uncertaintyToText(u)}</li>
              ))}
            </ul>

            <p className="text-xs text-black/60">
              These are the only sources of uncertainty considered in this
              report.
            </p>
          </section>
        )}

        {/* =====================================================
            RISK WEIGHTING
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            How risk was weighed
          </h2>

          {renderParagraph(
            (analysis as any).riskWeightingExplanation
          )}
        </section>

        {/* =====================================================
            NEGOTIATION POSITION
        ===================================================== */}
        <section className="border border-black/20 px-6 py-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Buyer positioning
          </h2>

          {renderParagraph(
            negotiation.summary ??
              negotiation.message ??
              negotiation.text
          )}

          <div className="flex gap-6 text-sm">
            {conservativeRange && (
              <span>
                <strong>Conservative adjustment:</strong>{" "}
                {conservativeRange}
              </span>
            )}
            {assertiveRange && (
              <span>
                <strong>Assertive adjustment:</strong>{" "}
                {assertiveRange}
              </span>
            )}
          </div>
        </section>

        {/* =====================================================
            DISCLAIMER
        ===================================================== */}
        <div className="border border-black/20 bg-black/5 px-5 py-4 text-xs">
          This document is not a mechanical inspection, defect report, or
          valuation. It reflects buyer-recorded observations only and should be
          used alongside professional inspections and independent checks.
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
