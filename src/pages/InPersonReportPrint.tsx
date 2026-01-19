// src/pages/InPersonReportPrint.tsx

import { useEffect, useMemo, type ReactNode } from "react";
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

function Paragraph({
  value,
  muted = false,
}: {
  value: unknown;
  muted?: boolean;
}): ReactNode {
  const t = asCleanText(value);
  if (!t) return null;
  return (
    <p
      className={`text-sm leading-relaxed whitespace-pre-line ${
        muted ? "text-black/60" : "text-black/80"
      }`}
    >
      {t}
    </p>
  );
}

function BulletList({ items }: { items: string[] }): ReactNode {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-1 text-sm text-black/80">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function renderEvidenceSummary(evidenceSummary: unknown): ReactNode {
  if (typeof evidenceSummary === "string") {
    return <Paragraph value={evidenceSummary} />;
  }

  if (Array.isArray(evidenceSummary)) {
    const strings = evidenceSummary.map(asCleanText).filter(Boolean);
    if (strings.length > 0) return <BulletList items={strings} />;
  }

  if (isRecord(evidenceSummary)) {
    const candidateKeys = [
      "summary",
      "text",
      "notes",
      "bullets",
      "bulletPoints",
      "points",
      "items",
    ];

    for (const key of candidateKeys) {
      const v = evidenceSummary[key];
      if (typeof v === "string" && v.trim()) return <Paragraph value={v} />;
      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return <BulletList items={strings} />;
      }
    }
  }

  return (
    <p className="text-sm text-black/60">
      Evidence was recorded during the inspection but could not be summarised
      into text.
    </p>
  );
}

function uncertaintyToText(u: unknown): string {
  if (typeof u === "string") return u;

  if (isRecord(u)) {
    return (
      asCleanText(u.label) ||
      asCleanText(u.title) ||
      asCleanText(u.reason) ||
      asCleanText(u.description) ||
      "An item was marked as unsure by the buyer."
    );
  }

  return "An item was marked as unsure by the buyer.";
}

function formatMoney(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
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

function safeDateLabel(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  try {
    return new Date().toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return new Date().toLocaleDateString();
  }
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function InPersonReportPrint() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  // Guard: if user refreshes this page without progress, bounce safely.
  useEffect(() => {
    if (!progress?.scanId) {
      navigate("/my-scans", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analysis = useMemo(() => {
    return analyseInPersonInspection(progress);
  }, [progress]);

  const photos: string[] = (progress?.photos ?? []).map((p: any) => p.dataUrl);

  const scanId = progress?.scanId ?? "—";
  const reportDate = safeDateLabel(progress?.createdAt ?? progress?.date);

  const vehicleTitle = (() => {
    const year =
      progress?.vehicle?.year || progress?.year || progress?.vehicleYear || "";
    const make =
      progress?.vehicle?.make || progress?.make || progress?.vehicleMake || "";
    const model =
      progress?.vehicle?.model ||
      progress?.model ||
      progress?.vehicleModel ||
      "";

    const parts = [year, make, model].filter(Boolean);
    return parts.length ? parts.join(" ") : "Vehicle";
  })();

  const askingPrice =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const priorityRisks = analysis.risks.filter((r) => r.severity === "critical");
  const moderateRisks = analysis.risks.filter((r) => r.severity === "moderate");

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  // Print report must NOT include negotiation scripts or negotiation ranges.
  const buyerPositioningText =
    (analysis as any)?.buyerPositioning ??
    (analysis as any)?.positioning ??
    (analysis as any)?.buyerPosture ??
    null;

  function triggerPrint() {
    window.print();
  }

  function backToReport() {
    if (scanId && scanId !== "—") {
      navigate(`/scan/in-person/results/${scanId}`);
      return;
    }
    navigate("/my-scans");
  }

  // Auto-trigger print dialog (feels like "Download PDF")
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // ignore
      }
    }, 350);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="print-body bg-white text-black min-h-screen">
      <div className="print-page max-w-3xl mx-auto px-10 py-14 space-y-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="print-block space-y-4 border-b border-black/20 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-[240px]">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="CarVerity"
                  className="h-7 w-7 object-contain"
                />
                <p className="text-xs uppercase tracking-[0.18em] text-black/50">
                  CarVerity — In-person report
                </p>
              </div>

              <h1 className="text-3xl font-bold mt-3">{vehicleTitle}</h1>

              <p className="text-sm text-black/60 mt-2 leading-relaxed">
                A buyer-recorded inspection summary with clear reasoning — based
                only on what was observed and marked during the scan.
              </p>
            </div>

            <div className="text-right text-sm text-black/70 space-y-1">
              <div>
                <strong>Scan ID:</strong> {scanId}
              </div>
              <div>
                <strong>Date:</strong> {reportDate}
              </div>
              <div>
                <strong>Asking price:</strong> {formatMoney(askingPrice)}
              </div>
            </div>
          </div>

          <Paragraph
            muted
            value="This report summarises what was recorded during a guided, buyer-performed in-person inspection. It reflects observed evidence and buyer-marked uncertainty only, and does not assume unobserved conditions."
          />
        </header>

        {/* =====================================================
            EXECUTIVE VERDICT
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Executive verdict
          </h2>

          <p className="text-xl font-semibold">
            {analysis.verdict === "proceed"
              ? "Proceed normally"
              : analysis.verdict === "caution"
              ? "Proceed — after targeted clarification"
              : "Risk appears elevated — pausing / walking away is reasonable"}
          </p>

          <Paragraph
            value={
              (analysis as any).whyThisVerdict ||
              (analysis as any).verdictReason ||
              (analysis as any).summary
            }
          />

          <div className="flex flex-wrap gap-6 pt-2 text-sm">
            <span>
              <strong>Confidence:</strong> {analysis.confidenceScore}%
            </span>
            <span>
              <strong>Coverage:</strong> {analysis.completenessScore}%
            </span>
          </div>

          <div className="border border-black/15 bg-black/5 px-5 py-4 text-sm">
            <p className="font-semibold">How to save this report</p>
            <p className="text-black/70 mt-1 leading-relaxed">
              In the print dialog, choose <strong>Save as PDF</strong> (desktop)
              or <strong>Share → Save to Files</strong> (iPhone).
            </p>
          </div>
        </section>

        {/* =====================================================
            EVIDENCE BASIS
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Evidence considered
          </h2>

          {renderEvidenceSummary((analysis as any).evidenceSummary)}

          <p className="text-xs text-black/60">
            Only evidence you recorded and items you explicitly marked as unsure
            are used. Missing checks are treated as not recorded, not as risk.
          </p>
        </section>

        {/* =====================================================
            PRIORITY FINDINGS
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Priority findings
          </h2>

          {priorityRisks.length > 0 ? (
            <ul className="space-y-3">
              {priorityRisks.map((r) => (
                <li
                  key={r.id}
                  className="print-card border border-black/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold">
                    {r.label}{" "}
                    <span className="text-xs font-normal text-black/60">
                      (high impact)
                    </span>
                  </p>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">
                    {r.explanation}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black/70">
              No high-impact findings were recorded during this inspection.
            </p>
          )}
        </section>

        {/* =====================================================
            ITEMS WORTH CLARIFYING
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Items worth clarifying
          </h2>

          {moderateRisks.length > 0 ? (
            <ul className="space-y-3">
              {moderateRisks.map((r) => (
                <li
                  key={r.id}
                  className="print-card border border-black/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold">
                    {r.label}{" "}
                    <span className="text-xs font-normal text-black/60">
                      (medium impact)
                    </span>
                  </p>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">
                    {r.explanation}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-black/70">
              No medium-impact clarifications were recorded.
            </p>
          )}
        </section>

        {/* =====================================================
            DECLARED UNCERTAINTY
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Buyer-declared uncertainty
          </h2>

          {uncertaintyFactors.length > 0 ? (
            <>
              <ul className="list-disc list-inside space-y-1 text-sm text-black/80">
                {uncertaintyFactors.map((u, i) => (
                  <li key={i}>{uncertaintyToText(u)}</li>
                ))}
              </ul>

              <p className="text-xs text-black/60">
                These are treated as unknowns to verify — not automatic faults.
              </p>
            </>
          ) : (
            <p className="text-sm text-black/70">
              No buyer-declared uncertainty was recorded.
            </p>
          )}
        </section>

        {/* =====================================================
            HOW RISK WAS WEIGHED
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            How risk was weighed
          </h2>

          <Paragraph value={(analysis as any).riskWeightingExplanation} />
        </section>

        {/* =====================================================
            BUYER POSITIONING (NO NEGOTIATION)
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Buyer-safe posture
          </h2>

          <Paragraph
            value={
              buyerPositioningText ||
              "This report is designed to reduce buyer regret. It highlights the few checks that matter most, what they mean, and what to verify before you commit."
            }
          />

          <div className="border border-black/15 bg-black/5 px-5 py-4 text-sm">
            <p className="font-semibold">Reminder</p>
            <p className="text-black/70 mt-1 leading-relaxed">
              This report does not include negotiation scripts. It focuses on
              clarity, evidence, and decision confidence.
            </p>
          </div>
        </section>

        {/* =====================================================
            PHOTO EVIDENCE
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Photo evidence
          </h2>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {photos.map((src, i) => (
                <figure key={i} className="print-card space-y-1">
                  <img
                    src={src}
                    alt={`Inspection photo ${i + 1}`}
                    className="border border-black/20 object-cover aspect-square w-full"
                  />
                  <figcaption className="text-[11px] text-black/50">
                    Buyer-captured inspection photo {i + 1}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black/70">
              No photos were captured during this inspection.
            </p>
          )}
        </section>

        {/* =====================================================
            DISCLAIMER
        ===================================================== */}
        <div className="print-block border border-black/20 bg-black/5 px-6 py-4 text-xs leading-relaxed">
          This document is not a mechanical inspection, defect report, or
          valuation. It reflects buyer-recorded observations only and should be
          used alongside professional inspections and independent checks.
        </div>

        {/* =====================================================
            ACTIONS (NO PRINT)
        ===================================================== */}
        <div className="no-print flex flex-wrap gap-3 pt-2">
          <button
            onClick={triggerPrint}
            className="px-4 py-2 rounded bg-black text-white font-semibold"
          >
            Print / Save as PDF
          </button>

          <button
            onClick={backToReport}
            className="px-4 py-2 rounded border border-black/30"
          >
            Back to report
          </button>
        </div>
      </div>

      <style>{`
        /* ===== Print rules that stop the browser doing ugly page splits ===== */

        /* Force the print page to be its own clean document (no app chrome). */
        .print-body {
          background: white;
        }

        /* Avoid weird scaling differences between Chrome/Safari */
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @page {
          size: A4;
          margin: 14mm;
        }

        @media print {
          html, body {
            background: white !important;
          }

          /* Hide any nav/layout that might still render */
          header, footer, nav {
            display: none !important;
          }

          .no-print {
            display: none !important;
          }

          .print-page {
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: none !important;
          }

          /* Prevent sections/cards/images from being cut in half */
          .print-block,
          .print-card,
          section,
          figure,
          img {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Give headings a little breathing room so they don't orphan */
          h1, h2, h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
