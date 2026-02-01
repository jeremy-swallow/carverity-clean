// src/pages/InPersonReportPrint.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";
import { supabase } from "../supabaseClient";

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

function verdictLabel(verdict: unknown): string {
  if (verdict === "proceed") return "Proceed normally";
  if (verdict === "caution") return "Proceed after clarification";
  if (verdict === "walk-away") return "Elevated risk — pausing is reasonable";
  return "Buyer-safe summary";
}

/* -------------------------------------------------------
   Photos (Supabase signed URLs)
------------------------------------------------------- */
const PHOTO_BUCKET = "scan-photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour

function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

function normaliseStoragePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let p = value.trim();
  if (!p) return null;

  // remove leading slash
  if (p.startsWith("/")) p = p.slice(1);

  // if someone stored bucket name in the path, strip it
  if (p.startsWith(`${PHOTO_BUCKET}/`)) {
    p = p.replace(`${PHOTO_BUCKET}/`, "");
  }

  // also strip "public/" if present
  if (p.startsWith("public/")) {
    p = p.replace("public/", "");
  }

  return p || null;
}

async function createSignedUrlSafe(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds);

    if (error) {
      console.warn("[Print] createSignedUrl failed:", error.message);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn("[Print] createSignedUrl exception:", e);
    return null;
  }
}

/* -------------------------------------------------------
   Page
------------------------------------------------------- */
export default function InPersonReportPrint() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const scanIdSafe = scanId ? String(scanId).trim() : "";

  const saved = useMemo(() => {
    if (!scanIdSafe) return null;
    try {
      return loadScanById(scanIdSafe);
    } catch (e) {
      console.warn("[Print] loadScanById failed:", e);
      return null;
    }
  }, [scanIdSafe]);

  const progressFallback = useMemo(() => {
    try {
      return loadProgress();
    } catch (e) {
      console.warn("[Print] loadProgress failed:", e);
      return null;
    }
  }, []);

  const progress: any = saved?.progressSnapshot ?? progressFallback ?? {};

  // Guard: if user refreshes this page without scan data, bounce safely.
  useEffect(() => {
    if (scanIdSafe && !saved) {
      navigate("/my-scans", { replace: true });
      return;
    }

    if (!scanIdSafe && !progress?.scanId) {
      navigate("/my-scans", { replace: true });
    }
  }, [scanIdSafe, saved, progress, navigate]);

  // analyseInPersonInspection expects followUpPhotos to include stepId.
  const progressForAnalysis = useMemo(() => {
    const base: any = progress ?? {};

    const followUpPhotos = Array.isArray(base.followUpPhotos)
      ? base.followUpPhotos.map((p: any) => ({
          ...(p ?? {}),
          stepId:
            p?.stepId ??
            p?.stepid ??
            p?.stepID ??
            p?.step ??
            "follow-up",
        }))
      : undefined;

    const photos = Array.isArray(base.photos)
      ? base.photos.map((p: any) => ({
          ...(p ?? {}),
          stepId: p?.stepId ?? p?.stepid ?? p?.stepID ?? p?.step ?? "photo",
        }))
      : undefined;

    return {
      ...base,
      ...(followUpPhotos ? { followUpPhotos } : {}),
      ...(photos ? { photos } : {}),
    };
  }, [progress]);

  const analysis = useMemo(() => {
    try {
      if (saved?.analysis) return saved.analysis;
      return analyseInPersonInspection(progressForAnalysis as any);
    } catch (e) {
      console.error("[Print] analyseInPersonInspection failed:", e);
      return analyseInPersonInspection((progressFallback ?? {}) as any);
    }
  }, [saved, progressForAnalysis, progressFallback]);

  /* =========================================================
     Photo evidence (signed URLs)
  ========================================================== */

  const rawPhotoEntries: any[] = Array.isArray(progress?.photos)
    ? (progress.photos as any[])
    : [];

  const storagePaths: string[] = useMemo(() => {
    const out: string[] = [];

    for (const p of rawPhotoEntries) {
      // allow legacy base64 dataUrl (rare)
      if (isDataUrl(p?.dataUrl)) {
        out.push(p.dataUrl);
        continue;
      }

      const normalised = normaliseStoragePath(p?.storagePath);
      if (normalised) out.push(normalised);
    }

    // de-dupe
    return Array.from(new Set(out));
  }, [rawPhotoEntries]);

  const [signedPhotoUrls, setSignedPhotoUrls] = useState<string[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSignedPhotos() {
      if (storagePaths.length === 0) {
        setSignedPhotoUrls([]);
        return;
      }

      setPhotosLoading(true);

      try {
        const urls: string[] = [];

        for (const pathOrData of storagePaths) {
          // If it's already a dataUrl, keep it.
          if (isDataUrl(pathOrData)) {
            urls.push(pathOrData);
            continue;
          }

          const signed = await createSignedUrlSafe(
            PHOTO_BUCKET,
            pathOrData,
            SIGNED_URL_TTL
          );

          if (signed) urls.push(signed);
        }

        if (!cancelled) setSignedPhotoUrls(urls);
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    }

    void loadSignedPhotos();

    return () => {
      cancelled = true;
    };
  }, [storagePaths]);

  const scanIdForDisplay = scanIdSafe || progress?.scanId || "—";
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

  const risksSafe: any[] = Array.isArray((analysis as any)?.risks)
    ? ((analysis as any).risks as any[])
    : [];

  const priorityRisks = risksSafe.filter((r) => r?.severity === "critical");
  const moderateRisks = risksSafe.filter((r) => r?.severity === "moderate");

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

  const qrSrc = useMemo(() => {
    const size = 180;
    const data = encodeURIComponent(APP_URL);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=2&format=png&data=${data}`;
  }, [APP_URL]);

  function triggerPrint() {
    window.print();
  }

  function backToReport() {
    const id = scanIdSafe || progress?.scanId;
    if (id) {
      navigate(`/scan/in-person/results/${id}`);
      return;
    }
    navigate("/my-scans");
  }

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
      {/* =====================================================
          COVER PAGE (prints as page 1)
      ===================================================== */}
      <div className="print-cover">
        <div className="print-cover-inner">
          <div className="print-cover-top">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="CarVerity"
                className="h-10 w-10 object-contain"
              />
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-black/55">
                  CarVerity
                </div>
                <div className="text-sm font-semibold text-black/80">
                  In-person inspection report
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-4xl font-bold leading-tight">
                {vehicleTitle}
              </h1>
              <p className="text-sm text-black/65 mt-3 leading-relaxed max-w-xl">
                A buyer-recorded inspection summary designed to reduce regret.
                It reflects only what was observed, photographed, and marked
                during the scan.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-black/15 bg-white px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-black/50">
                  Verdict
                </div>
                <div className="text-base font-semibold text-black/85 mt-1">
                  {verdictLabel((analysis as any)?.verdict)}
                </div>
                <div className="mt-2 text-xs text-black/60 leading-relaxed">
                  Based on recorded concerns, unknowns, and evidence.
                </div>
              </div>

              <div className="rounded-2xl border border-black/15 bg-white px-5 py-4">
                <div className="text-[10px] uppercase tracking-widest text-black/50">
                  Report details
                </div>
                <div className="mt-2 space-y-1 text-sm text-black/75">
                  <div>
                    <strong>Scan ID:</strong> {scanIdForDisplay}
                  </div>
                  <div>
                    <strong>Date:</strong> {reportDate}
                  </div>
                  <div>
                    <strong>Asking price:</strong> {formatMoney(askingPrice)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/12 bg-black/[0.03] px-5 py-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Confidence
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {(analysis as any)?.confidenceScore ?? 0}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Coverage
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {(analysis as any)?.completenessScore ?? 0}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Photos
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {signedPhotoUrls.length}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-black/60 leading-relaxed">
                  This is not a mechanical inspection or valuation. It’s a
                  structured summary of what the buyer recorded during an
                  in-person check.
                </p>
              </div>
            </div>
          </div>

          <div className="print-cover-bottom">
            <div className="flex items-end justify-between gap-8">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-black/45">
                  Produced by
                </div>
                <div className="text-sm font-semibold text-black/75 mt-1">
                  CarVerity
                </div>

                <div className="mt-2 text-[11px] text-black/60">
                  <span className="font-semibold text-black/65">Website:</span>{" "}
                  {APP_URL}
                  <span className="mx-2 text-black/25">•</span>
                  <span className="font-semibold text-black/65">Support:</span>{" "}
                  {SUPPORT_EMAIL}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-[10px] text-black/55 text-right leading-tight">
                  Scan to visit
                  <br />
                  CarVerity
                </div>
                <img
                  src={qrSrc}
                  alt="CarVerity QR code"
                  className="h-16 w-16 border border-black/15 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
              {APP_URL} <span className="mx-2 text-black/25">•</span>
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

      {/* =====================================================
          REPORT CONTENT (starts on next page)
      ===================================================== */}
      <div className="print-page px-10 py-14 space-y-10">
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
                  <strong>Scan ID:</strong> {scanIdForDisplay}
                </div>
                <div>
                  <strong>Date:</strong> {reportDate}
                </div>
                <div>
                  <strong>Asking price:</strong> {formatMoney(askingPrice)}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 bg-white px-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Verdict
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {verdictLabel((analysis as any)?.verdict)}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Confidence
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {(analysis as any)?.confidenceScore ?? 0}%
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-black/50">
                    Coverage
                  </div>
                  <div className="text-sm font-semibold text-black/85 mt-1">
                    {(analysis as any)?.completenessScore ?? 0}%
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <Paragraph
                  muted
                  value="This report summarises what was recorded during a guided, buyer-performed in-person inspection. It reflects observed evidence and buyer-marked uncertainty only, and does not assume unobserved conditions."
                />
              </div>
            </div>
          </div>
        </header>

        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Executive verdict
          </h2>

          <p className="text-xl font-semibold">
            {(analysis as any)?.verdict === "proceed"
              ? "Proceed normally"
              : (analysis as any)?.verdict === "caution"
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

          <div className="print-card rounded-2xl border border-black/15 bg-black/5 px-5 py-4 text-sm">
            <p className="font-semibold">How to save this report</p>
            <p className="text-black/70 mt-1 leading-relaxed">
              In the print dialog, choose <strong>Save as PDF</strong> (desktop)
              or <strong>Share → Save to Files</strong> (iPhone).
            </p>
          </div>
        </section>

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

        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Priority findings
          </h2>

          {priorityRisks.length > 0 ? (
            <ul className="space-y-3">
              {priorityRisks.map((r: any) => (
                <li
                  key={String(r?.id ?? r?.label ?? Math.random())}
                  className="print-card rounded-2xl border border-black/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold">
                    {r?.label ?? "Priority finding"}{" "}
                    <span className="text-xs font-normal text-black/60">
                      (high impact)
                    </span>
                  </p>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">
                    {r?.explanation ?? ""}
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

        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Items worth clarifying
          </h2>

          {moderateRisks.length > 0 ? (
            <ul className="space-y-3">
              {moderateRisks.map((r: any) => (
                <li
                  key={String(r?.id ?? r?.label ?? Math.random())}
                  className="print-card rounded-2xl border border-black/15 px-5 py-4"
                >
                  <p className="text-sm font-semibold">
                    {r?.label ?? "Item"}{" "}
                    <span className="text-xs font-normal text-black/60">
                      (medium impact)
                    </span>
                  </p>
                  <p className="text-sm text-black/70 mt-1 leading-relaxed">
                    {r?.explanation ?? ""}
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

        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            How risk was weighed
          </h2>

          <Paragraph value={(analysis as any).riskWeightingExplanation} />
        </section>

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

        <section className="print-block space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60">
            Photo evidence
          </h2>

          {photosLoading ? (
            <p className="text-sm text-black/60">Loading photos…</p>
          ) : signedPhotoUrls.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {signedPhotoUrls.map((src, i) => (
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

        <div className="print-block rounded-2xl border border-black/20 bg-black/5 px-6 py-4 text-xs leading-relaxed">
          This document is not a mechanical inspection, defect report, or
          valuation. It reflects buyer-recorded observations only and should be
          used alongside professional inspections and independent checks.
        </div>

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
        .print-body { background: white; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .brand-strip { background: rgba(0,0,0,0.02); }
        :root { --print-footer-reserve: 34mm; }

        /* Slightly larger side margins for safer printing */
        @page { size: A4; margin: 18mm 18mm 24mm 18mm; }

        .print-footer { display: none; }
        .print-block { break-inside: avoid; page-break-inside: avoid; }

        .print-cover {
  width: 100%;
  margin: 0;
  padding: 18mm 18mm 26mm 18mm;
}

        .print-cover-inner {
          min-height: calc(297mm - 16mm - 24mm);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12mm;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 18px;
          padding: 14mm;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.02) 0%,
            rgba(0,0,0,0.00) 55%,
            rgba(0,0,0,0.02) 100%
          );
        }

        .print-cover-top { flex: 1; min-width: 0; }
        .print-cover-bottom { border-top: 1px solid rgba(0,0,0,0.12); padding-top: 8mm; }

        @media print {
          html, body { background: white !important; }
          header, footer, nav { display: none !important; }
          .no-print { display: none !important; }

          .print-cover { page-break-after: always; break-after: page; }

          .print-page {
            margin: 0 auto !important;
            max-width: none !important;

            /* KEEP SAFE INTERNAL PADDING so text never hits edges */
            padding-left: 16mm !important;
            padding-right: 16mm !important;
            padding-top: 10mm !important;

            /* keep room for footer */
            padding-bottom: var(--print-footer-reserve) !important;
          }

          .print-footer {
            display: block !important;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            border-top: 1px solid rgba(0,0,0,0.18);
            padding: 6mm 16mm;
            z-index: 9999;
          }

          .print-footer-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12mm;
          }

          .print-footer-left { flex: 1; min-width: 0; }

          .print-footer-right {
            display: flex;
            align-items: center;
            gap: 7mm;
          }

          .print-block, .print-card, section, figure, img {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          h1, h2, h3 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          p, li { orphans: 3; widows: 3; }

          figure { break-inside: avoid !important; }
          .print-card { border-color: rgba(0,0,0,0.18) !important; }
        }
      `}</style>
    </div>
  );
}
