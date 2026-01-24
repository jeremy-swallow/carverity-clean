/* =========================================================
   Inspection Storage Utility
   Local-only persistence (in-person only)

   IMPORTANT:
   localStorage quota is small (~5MB).
   NEVER store base64 photos in saved scans.
========================================================= */

import type { AnalysisResult } from "./inPersonAnalysis";
import type { ScanProgress } from "./scanProgress";

export type InspectionType = "in-person";

export interface InspectionHistoryEvent {
  at: string;
  event: string;
}

export interface SavedInspection {
  id: string;
  type: InspectionType;
  title: string;
  createdAt: string;

  // Vehicle identity (used for display + grouping)
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
  };

  // Yard / dealership context (used for grouping + shortlist workflows)
  yard?: {
    name?: string;
    suburb?: string;
  };

  // Thumbnail image (base64 dataUrl) — KEEP SMALL OR OMIT
  thumbnail?: string | null;

  // Optional summary metrics (used for MyScans + previews)
  askingPrice?: number | null;
  score?: number | null;
  concerns?: number | null;
  unsure?: number | null;
  imperfectionsCount?: number | null;
  photosCount?: number | null;

  // Helpful flags
  fromOnlineScan?: boolean;

  // Timeline of user actions (save, export, follow-ups, notes)
  history?: InspectionHistoryEvent[];

  // Completion hint (future use)
  completed?: boolean;

  /**
   * Persisted analysis output for reload-safe results.
   * Generated at the moment report generation begins.
   */
  analysis?: AnalysisResult;

  /**
   * Persisted progress snapshot at the time of report generation.
   * NOTE: this MUST NOT include base64 photo data.
   */
  progressSnapshot?: ScanProgress;
}

const STORAGE_KEY = "carverity_saved_inspections";

/* =========================================================
   Helpers
========================================================= */

function safeNowIso() {
  return new Date().toISOString();
}

function isProbablyBase64DataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value.startsWith("data:image/") || value.startsWith("data:application/"))
  );
}

/**
 * localStorage is tiny. A single base64 photo can be >1MB.
 * We strip all dataUrl fields before saving progressSnapshot.
 */
function stripPhotosFromProgress(
  progress?: ScanProgress
): ScanProgress | undefined {
  if (!progress) return undefined;

  const next: ScanProgress = { ...progress };

  // Photos (captured during scan)
  if (Array.isArray((next as any).photos)) {
    (next as any).photos = (next as any).photos.map((p: any) => ({
      id: p?.id,
      stepId: p?.stepId,
      // storagePath intentionally not needed for local snapshot
    }));
  }

  // Follow-up photos (captured after scan)
  if (Array.isArray((next as any).followUpPhotos)) {
    (next as any).followUpPhotos = (next as any).followUpPhotos.map(
      (p: any) => ({
        id: p?.id,
        note: p?.note,
        // storagePath intentionally not needed for local snapshot
      })
    );
  }

  return next;
}

/**
 * If thumbnail is a base64 dataUrl, it can also blow quota.
 * We keep it only if it's "small enough".
 */
function safeThumbnail(thumbnail?: string | null): string | null {
  if (!thumbnail) return null;

  if (!isProbablyBase64DataUrl(thumbnail)) {
    return thumbnail;
  }

  // Rough guard: base64 strings are huge; keep only small ones.
  // 120k chars ~ ~90KB raw-ish (still large, but acceptable for a thumbnail)
  if (thumbnail.length > 120_000) return null;

  return thumbnail;
}

function normaliseInspections(records: any[]): SavedInspection[] {
  return records.map((record) => ({
    ...record,
    type: "in-person",
    createdAt: record.createdAt || record.created_at || safeNowIso(),
    title: record.title || "In-person inspection",
    completed: record.completed ?? false,
    history: record.history ?? [],
    thumbnail: record.thumbnail ?? null,
    analysis: record.analysis ?? undefined,
    progressSnapshot: record.progressSnapshot ?? undefined,
    yard: record.yard ?? undefined,
  })) as SavedInspection[];
}

function tryWriteToStorage(scans: SavedInspection[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

/**
 * If storage is full, we prune older scans until it fits.
 * This ensures the current scan still saves.
 */
function writeWithPrune(scans: SavedInspection[]) {
  // First attempt
  try {
    tryWriteToStorage(scans);
    return;
  } catch (err: any) {
    const message = String(err?.message || "");
    const name = String(err?.name || "");

    const isQuota =
      name === "QuotaExceededError" ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("exceeded");

    if (!isQuota) {
      // Unknown storage failure
      throw err;
    }
  }

  // Prune strategy: keep newest first, drop oldest until it fits
  let pruned = [...scans];

  while (pruned.length > 0) {
    pruned = pruned.slice(0, pruned.length - 1);

    try {
      tryWriteToStorage(pruned);
      return;
    } catch {
      // keep pruning
    }
  }

  // If we STILL can't write, give up silently (but don't crash app)
  // This is extremely rare unless localStorage is blocked.
}

/* =========================================================
   Public API
========================================================= */

export function loadScans(): SavedInspection[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normaliseInspections(parsed);
  } catch {
    return [];
  }
}

export function loadScanById(inspectionId: string): SavedInspection | null {
  const scans = loadScans();
  return scans.find((s) => s.id === inspectionId) ?? null;
}

export function saveScan(inspection: SavedInspection) {
  if (typeof window === "undefined") return;

  const existing = loadScans().filter((i) => i.id !== inspection.id);

  const safeProgressSnapshot = stripPhotosFromProgress(inspection.progressSnapshot);

  const updated: SavedInspection[] = [
    {
      ...inspection,
      type: "in-person",
      title: inspection.title || "In-person inspection",
      createdAt: inspection.createdAt || safeNowIso(),
      completed: inspection.completed ?? false,
      history: inspection.history ?? [],
      thumbnail: safeThumbnail(inspection.thumbnail ?? null),
      analysis: inspection.analysis ?? undefined,
      progressSnapshot: safeProgressSnapshot ?? undefined,
      yard: inspection.yard ?? undefined,
    },
    ...existing,
  ];

  try {
    writeWithPrune(updated);
  } catch (err) {
    // Never crash the app due to storage issues
    console.warn("[scanStorage] saveScan failed:", err);
  }
}

export function updateScanTitle(inspectionId: string, title: string) {
  if (typeof window === "undefined") return;

  const updated = loadScans().map((inspection) =>
    inspection.id === inspectionId ? { ...inspection, title } : inspection
  );

  try {
    writeWithPrune(updated);
  } catch (err) {
    console.warn("[scanStorage] updateScanTitle failed:", err);
  }
}

export function deleteScan(inspectionId: string) {
  if (typeof window === "undefined") return;

  const filtered = loadScans().filter((i) => i.id !== inspectionId);

  try {
    writeWithPrune(filtered);
  } catch (err) {
    console.warn("[scanStorage] deleteScan failed:", err);
  }
}

export function clearAllScans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `inspection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
