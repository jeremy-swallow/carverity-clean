/* ============================================================
   In-Person Report Guard (STRICT TYPE-SAFE)
   ------------------------------------------------------------
   Purpose:
   - Prevent blank in-person results after credit spend
   - Reconstruct analysis ONLY into SavedScan
   - Never mutate ScanProgress structure
============================================================ */

import { loadScanById, saveScan } from "./scanStorage";
import { loadProgress } from "./scanProgress";
import { analyseInPersonInspection } from "./inPersonAnalysis";

/* ------------------------------------------------------------
   Helpers
------------------------------------------------------------ */

function isObject(v: any): v is Record<string, any> {
  return Boolean(v && typeof v === "object");
}

function scanLooksCompleted(scan: any): boolean {
  return Boolean(scan?.completed);
}

function safeTitle(scanId: string, savedScan: any, progress: any): string {
  const fromSaved =
    typeof savedScan?.title === "string" && savedScan.title.trim().length > 0
      ? savedScan.title.trim()
      : null;

  if (fromSaved) return fromSaved;

  const year = progress?.vehicleYear ?? progress?.vehicle?.year ?? "";
  const make = progress?.vehicleMake ?? progress?.vehicle?.make ?? "";
  const model = progress?.vehicleModel ?? progress?.vehicle?.model ?? "";

  const parts = [year, make, model].filter(Boolean).map((x: any) => String(x));
  if (parts.length) return parts.join(" ");

  return `In-person inspection (${scanId})`;
}

function safeCreatedAt(savedScan: any): string {
  const v = savedScan?.createdAt;
  if (typeof v === "string" && v.trim().length > 0) return v;
  return new Date().toISOString();
}

/* ------------------------------------------------------------
   Core guard
------------------------------------------------------------ */

function runGuard() {
  try {
    const progress = loadProgress();
    if (!isObject(progress)) return;

    const scanId = progress.scanId;
    if (!scanId) return;

    const savedScan = loadScanById(scanId);

    // If scan already has analysis, nothing to do
    if (savedScan?.analysis) return;

    // Only reconstruct if credit was spent / scan marked completed
    if (!scanLooksCompleted(savedScan)) return;

    // Re-run analysis using progress as loose input
    // (analysis function already tolerates partials)
    const reconstructedAnalysis = analyseInPersonInspection({
      ...(progress as any),
      scanId,
    });

    saveScan({
      ...(savedScan ?? {}),
      id: scanId,
      type: "in-person",
      title: safeTitle(scanId, savedScan, progress), // ✅ always string
      createdAt: safeCreatedAt(savedScan), // ✅ always string
      completed: true,
      analysis: reconstructedAnalysis,
      progressSnapshot: progress,
    });
  } catch (err) {
    console.error("[InPersonReportGuard] failed:", err);
  }
}

/* ------------------------------------------------------------
   Run once per app load
------------------------------------------------------------ */

let ran = false;

export function ensureInPersonReportSafety() {
  if (ran) return;
  ran = true;
  runGuard();
}

// Auto-run on import
ensureInPersonReportSafety();
