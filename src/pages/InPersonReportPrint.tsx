// src/pages/InPersonReportPrint.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

/* -------------------------------------------------------
   Small helpers (print-safe)
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
      className={[
        "text-[13.5px] leading-relaxed whitespace-pre-line",
        muted ? "text-black/60" : "text-black/80",
      ].join(" ")}
    >
      {t}
    </p>
  );
}

function BulletList({ items }: { items: string[] }): ReactNode {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-1 text-[13.5px] text-black/80">
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
    <p className="text-[13.5px] text-black/60">
      Evidence was recorded during the inspection, but could not be summarised
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
      "An item was marked as unsure."
    );
  }

  return "An item was marked as unsure.";
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

  const [logoOk, setLogoOk] = useState(true);

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

  const verdictLabel =
    analysis.verdict === "proceed"
      ? "Proceed normally"
      : analysis.verdict === "caution"
      ? "Proceed — after clarification"
      : "Risk appears higher — pausing is reasonable";

  const verdictSupport =
    analysis.verdict === "proceed"
      ? "No major concerns were recorded. Still confirm the basics before you buy."
      : analysis.verdict === "caution"
      ? "One or more items need clarification. Verify them before committing."
      : "One or more high-impact issues were recorded. If they can’t be resolved, walking away is sensible.";

  return (
    <div className="print-body bg-white text-black min-h-screen">
      <div className="print-page max-w-3xl mx-auto px-10 py-14 space-y-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="print-block space-y-4 border-b border-black/15 pb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-[240px]">
              <div className="flex items-center gap-3">
                {logoOk ? (
                  <img
                    src="/logo.png"
                    alt="CarVerity"
                    className="h-7 w-7 object-contain"
                    onError={() => setLogoOk(false)}
                  />
                ) : (
                  <div className="h-7 w-7 rounded-md border border-black/15 bg-black/5 flex items-center justify-center text-[10px] font-semibold text-black/60">
                    CV
                  </div>
                )}

                <p className="text-[11px] uppercase tracking-[0.18em] text-black/55">
                  CarVerity — In-person report
                </p>
              </div>

              <h1 className="text-[28px] leading-tight font-bold mt-3">
                {vehicleTitle}
              </h1>

              <p className="text-[13.5px] text-black/65 mt-2 leading-relaxed max-w-[520px]">
                A calm, buyer-recorded summary based only on what was checked,
                recorded, and marked during the inspection.
              </p>
            </div>

            <div className="text-right text-[13.5px] text-black/70 space-y-1">
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
            value="This is not a mechanical inspection or valuation. It’s a buyer-safe summary of what was observed and recorded during a guided walkaround."
          />
        </header>

        {/* =====================================================
            EXECUTIVE VERDICT
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Executive verdict
          </h2>

          <div className="border border-black/15 bg-black/[0.03] px-6 py-5">
            <p className="text-[18px] font-semibold">{verdictLabel}</p>
            <p className="text-[13.5px] text-black/70 mt-1 leading-relaxed">
              {verdictSupport}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-[13.5px]">
              <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-black/50">
                  Confidence
                </div>
                <div className="mt-1 text-[18px] font-semibold">
                  {analysis.confidenceScore}%
                </div>
              </div>

              <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-black/50">
                  Coverage
                </div>
                <div className="mt-1 text-[18px] font-semibold">
                  {analysis.completenessScore}%
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Paragraph
                value={
                  (analysis as any).whyThisVerdict ||
                  (analysis as any).verdictReason ||
                  (analysis as any).summary
                }
              />
            </div>
          </div>

          <div className="border border-black/15 bg-black/5 px-6 py-4 text-[13.5px]">
            <p className="font-semibold">Save this report as a PDF</p>
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
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Evidence considered
          </h2>

          {renderEvidenceSummary((analysis as any).evidenceSummary)}

          <p className="text-[11.5px] text-black/60 leading-relaxed">
            This report uses only what you recorded and what you marked as
            unsure. Missing checks are treated as “not recorded”, not as risk.
          </p>
        </section>

        {/* =====================================================
            PRIORITY FINDINGS
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Priority findings
          </h2>

          {priorityRisks.length > 0 ? (
            <ul className="space-y-3">
              {priorityRisks.map((r) => (
                <li
                  key={r.id}
                  className="print-card border border-black/15 bg-white px-6 py-4"
                >
                  <p className="text-[13.5px] font-semibold">
                    {r.label}{" "}
                    <span className="text-[11.5px] font-normal text-black/55">
                      (high impact)
                    </span>
                  </p>
                  <p className="text-[13.5px] text-black/70 mt-1 leading-relaxed">
                    {r.explanation}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-black/70">
              No high-impact findings were recorded.
            </p>
          )}
        </section>

        {/* =====================================================
            ITEMS WORTH CLARIFYING
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Items worth clarifying
          </h2>

          {moderateRisks.length > 0 ? (
            <ul className="space-y-3">
              {moderateRisks.map((r) => (
                <li
                  key={r.id}
                  className="print-card border border-black/15 bg-white px-6 py-4"
                >
                  <p className="text-[13.5px] font-semibold">
                    {r.label}{" "}
                    <span className="text-[11.5px] font-normal text-black/55">
                      (medium impact)
                    </span>
                  </p>
                  <p className="text-[13.5px] text-black/70 mt-1 leading-relaxed">
                    {r.explanation}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-black/70">
              No medium-impact clarifications were recorded.
            </p>
          )}
        </section>

        {/* =====================================================
            DECLARED UNCERTAINTY
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Items marked as unsure
          </h2>

          {uncertaintyFactors.length > 0 ? (
            <>
              <ul className="list-disc list-inside space-y-1 text-[13.5px] text-black/80">
                {uncertaintyFactors.map((u, i) => (
                  <li key={i}>{uncertaintyToText(u)}</li>
                ))}
              </ul>

              <p className="text-[11.5px] text-black/60 leading-relaxed">
                “Unsure” means unknown — not safe and not dangerous. Treat these
                as items to verify before you commit.
              </p>
            </>
          ) : (
            <p className="text-[13.5px] text-black/70">
              No unsure items were recorded.
            </p>
          )}
        </section>

        {/* =====================================================
            HOW RISK WAS WEIGHED
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            How risk was weighed
          </h2>

          <Paragraph value={(analysis as any).riskWeightingExplanation} />
        </section>

        {/* =====================================================
            BUYER POSITIONING (NO NEGOTIATION)
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Buyer-safe posture
          </h2>

          <Paragraph
            value={
              buyerPositioningText ||
              "This report is designed to reduce buyer regret. It highlights what matters, what it could mean, and what to verify before you decide."
            }
          />

          <div className="border border-black/15 bg-black/5 px-6 py-4 text-[13.5px]">
            <p className="font-semibold">Reminder</p>
            <p className="text-black/70 mt-1 leading-relaxed">
              This PDF report does not include negotiation scripts. It focuses
              on clarity, evidence, and decision confidence.
            </p>
          </div>
        </section>

        {/* =====================================================
            PHOTO EVIDENCE
        ===================================================== */}
        <section className="print-block space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-black/55">
            Photo evidence
          </h2>

          {photos.length > 0 ? (
            <div className="photo-grid grid grid-cols-3 gap-4">
              {photos.map((src, i) => (
                <figure key={i} className="print-card space-y-1">
                  <img
                    src={src}
                    alt={`Inspection photo ${i + 1}`}
                    className="border border-black/20 object-cover aspect-square w-full"
                  />
                  <figcaption className="text-[11px] text-black/55">
                    Photo {i + 1}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-black/70">
              No photos were captured during this inspection.
            </p>
          )}
        </section>

        {/* =====================================================
            DISCLAIMER
        ===================================================== */}
        <div className="print-block border border-black/15 bg-black/5 px-6 py-4 text-[11.5px] leading-relaxed text-black/70">
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
        /* ===== Print rules to stop ugly cut-offs ===== */

        .print-body {
          background: white;
        }

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
          figure {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Make images behave better in print */
          img {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            max-width: 100% !important;
            height: auto !important;
          }

          /* Keep photo grid rows together */
          .photo-grid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          /* Avoid orphan headings */
          h1, h2, h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
