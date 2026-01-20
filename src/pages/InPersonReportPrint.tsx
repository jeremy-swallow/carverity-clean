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

  const APP_URL = "https://carverity.com.au";
  const SUPPORT_EMAIL = "support@carverity.com.au";

  // QR code: keep as <img> for maximum print compatibility.
  // Notes:
  // - Using an external PNG endpoint is usually fine for print preview (Chrome/Safari),
  //   but requires network access at print time.
  // - Best-practice long-term is a local/static asset OR an inline SVG/Canvas-generated QR.
  //   (If you want that, we can add it next without changing this page structure.)
  const qrSrc = useMemo(() => {
    const size = 180;
    const data = encodeURIComponent(APP_URL);
    // Add a quiet zone (qzone) for better scan reliability in print.
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=2&format=png&data=${data}`;
  }, [APP_URL]);

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
      {/* Fixed footer (repeats on each printed page in Chrome/Safari) */}
      <div className="print-footer" aria-hidden="true">
        <div className="print-footer-inner">
          <div className="print-footer-left">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="CarVerity"
                className="h-5 w-5 object-contain"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-black/70">
                  Produced by CarVerity
                </div>
                <div className="text-[10px] text-black/55">
                  Buyer-recorded inspection summary (not a mechanical inspection)
                </div>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-black/60">
              <span className="font-semibold text-black/65">Website:</span>{" "}
              {APP_URL}{" "}
              <span className="mx-2 text-black/25">•</span>
              <span className="font-semibold text-black/65">Support:</span>{" "}
              {SUPPORT_EMAIL}
            </div>
          </div>

          <div className="print-footer-right">
            <div className="text-[10px] text-black/55 text-right leading-tight">
              Scan to visit
              <br />
              CarVerity
            </div>
            <img
              src={qrSrc}
              alt="CarVerity QR code"
              className="h-12 w-12 border border-black/15 rounded-sm"
            />
          </div>
        </div>
      </div>

      <div className="print-page max-w-3xl mx-auto px-10 py-14 space-y-10">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <header className="print-block space-y-5 border-b border-black/20 pb-6">
          <div className="brand-strip rounded-2xl border border-black/10 px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-[260px]">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="CarVerity"
                    className="h-9 w-9 object-contain"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-black/55">
                      CarVerity — In-person report
                    </p>
                    <p className="text-[11px] text-black/60 mt-1">
                      Produced by CarVerity · {APP_URL}
                    </p>
                  </div>
                </div>

                <h1 className="text-3xl font-bold mt-3">{vehicleTitle}</h1>

                <p className="text-sm text-black/65 mt-2 leading-relaxed">
                  A buyer-recorded inspection summary with clear reasoning —
                  based only on what was observed and marked during the scan.
                </p>
              </div>

              <div className="text-right text-sm text-black/75 space-y-1">
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

            <div className="mt-4">
              <Paragraph
                muted
                value="This report summarises what was recorded during a guided, buyer-performed in-person inspection. It reflects observed evidence and buyer-marked uncertainty only, and does not assume unobserved conditions."
              />
            </div>
          </div>
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

          <div className="print-card rounded-2xl border border-black/15 bg-black/5 px-5 py-4 text-sm">
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
                  className="print-card rounded-2xl border border-black/15 px-5 py-4"
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
                  className="print-card rounded-2xl border border-black/15 px-5 py-4"
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

          <div className="print-card rounded-2xl border border-black/15 bg-black/5 px-5 py-4 text-sm">
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
                    className="border border-black/20 object-cover aspect-square w-full rounded-xl"
                  />
                  <figcaption className="text-[11px] text-black/55">
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
        <div className="print-block rounded-2xl border border-black/20 bg-black/5 px-6 py-4 text-xs leading-relaxed">
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
        /* ======================================================
           PRINT/PDF LAYOUT
           Goals:
           - Premium spacing and consistent typography
           - Safe page margins (not too close to edges)
           - Footer never overlaps content
           - Avoid page breaks through cards/photos/sections
        ====================================================== */

        .print-body {
          background: white;
        }

        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Subtle “premium” frame inside the page content */
        .brand-strip {
          background: rgba(0,0,0,0.02);
        }

        /* Ensure the fixed footer has reserved space so it never overlaps */
        :root {
          --print-footer-reserve: 28mm; /* content padding at bottom in print */
        }

        /* A4 with generous margins (more breathing room than before) */
        @page {
          size: A4;
          margin: 16mm 16mm 22mm 16mm; /* extra bottom for footer safety */
        }

        /* Footer hidden on screen by default */
        .print-footer {
          display: none;
        }

        /* A few additional break rules for nicer pagination */
        .print-block {
          break-inside: avoid;
          page-break-inside: avoid;
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

          /* Make space so the fixed footer never overlaps content */
          .print-page {
            padding: 0 !important;
            margin: 0 auto !important;
            max-width: none !important;
            padding-bottom: var(--print-footer-reserve) !important;
          }

          /* Show and pin footer (prints on each page in Chromium-based browsers) */
          .print-footer {
            display: block !important;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            border-top: 1px solid rgba(0,0,0,0.18);
            padding: 7mm 16mm;
            z-index: 9999;
          }

          .print-footer-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12mm;
          }

          .print-footer-left {
            flex: 1;
            min-width: 0;
          }

          .print-footer-right {
            display: flex;
            align-items: center;
            gap: 7mm;
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

          /* Avoid lonely headings at bottom of page */
          h1, h2, h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          /* Improve paragraph/line breaking for print */
          p, li {
            orphans: 3;
            widows: 3;
          }

          /* Keep grids from producing weird clipping */
          figure {
            break-inside: avoid !important;
          }

          /* On some printers, borders can get too light; nudge contrast */
          .print-card {
            border-color: rgba(0,0,0,0.18) !important;
          }
        }
      `}</style>
    </div>
  );
}
