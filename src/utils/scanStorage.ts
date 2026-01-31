/* =========================================================
   Inspection Storage Utility
   Local-only persistence (in-person only)
========================================================= */

// src/utils/scanStorage.ts

import type { AnalysisResult } from "./inPersonAnalysis";
import type { ScanProgress } from "./scanProgress";

export type InspectionType = "in-person";

export interface InspectionHistoryEvent {
  at: string;
  event: string;
}

/**
 * AI interpretation payload (persisted verbatim)
 * Shape is intentionally loose to avoid future breakage.
 */
export type AiInterpretation = Record<string, any>;

export interface SavedInspection {
  id: string;
  type: InspectionType;
  title: string;
  createdAt: string;

  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
  };

  sale?: {
    type?: "dealership" | "private";
    name?: string;
    suburb?: string;
  };

  thumbnail?: string | null;

  askingPrice?: number | null;
  score?: number | null;
  concerns?: number | null;
  unsure?: number | null;
  imperfectionsCount?: number | null;
  photosCount?: number | null;

  fromOnlineScan?: boolean;

  history?: InspectionHistoryEvent[];
  completed?: boolean;

  analysis?: AnalysisResult;
  progressSnapshot?: ScanProgress;

  /** ✅ AI output — MUST persist across reloads */
  aiInterpretation?: AiInterpretation;
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

function stripPhotosFromProgress(
  progress?: ScanProgress
): ScanProgress | undefined {
  if (!progress) return undefined;

  const next: ScanProgress = { ...progress };

  if (Array.isArray((next as any).photos)) {
    (next as any).photos = (next as any).photos.map((p: any) => ({
      id: p?.id,
      stepId: p?.stepId,
      storagePath: p?.storagePath,
    }));
  }

  if (Array.isArray((next as any).followUpPhotos)) {
    (next as any).followUpPhotos = (next as any).followUpPhotos.map(
      (p: any) => ({
        id: p?.id,
        note: p?.note,
        storagePath: p?.storagePath,
      })
    );
  }

  if (Array.isArray((next as any).imperfections)) {
    (next as any).imperfections = (next as any).imperfections.map((imp: any) => {
      const cleaned: any = { ...imp };

      if (isProbablyBase64DataUrl(cleaned?.dataUrl)) delete cleaned.dataUrl;

      if (Array.isArray(cleaned?.photos)) {
        cleaned.photos = cleaned.photos.map((p: any) => ({
          id: p?.id,
          note: p?.note,
          stepId: p?.stepId,
          storagePath: p?.storagePath,
        }));
      }

      if (isProbablyBase64DataUrl(cleaned?.storagePath)) {
        delete cleaned.storagePath;
      }

      return cleaned;
    });
  }

  return next;
}

function safeThumbnail(thumbnail?: string | null): string | null {
  if (!thumbnail) return null;
  if (!isProbablyBase64DataUrl(thumbnail)) return thumbnail;
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
    aiInterpretation: record.aiInterpretation ?? undefined, // ✅ KEEP AI
    sale: record.sale ?? undefined,
  }));
}

function tryWriteToStorage(scans: SavedInspection[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

function writeWithPrune(scans: SavedInspection[]) {
  try {
    tryWriteToStorage(scans);
    return;
  } catch {}

  let pruned = [...scans];
  while (pruned.length > 0) {
    pruned = pruned.slice(0, pruned.length - 1);
    try {
      tryWriteToStorage(pruned);
      return;
    } catch {}
  }
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
  return loadScans().find((s) => s.id === inspectionId) ?? null;
}

export function saveScan(inspection: SavedInspection) {
  if (typeof window === "undefined") return;

  const existing = loadScans().filter((i) => i.id !== inspection.id);

  const updated: SavedInspection[] = [
    {
      ...inspection,
      type: "in-person",
      title: inspection.title || "In-person inspection",
      createdAt: inspection.createdAt || safeNowIso(),
      completed: inspection.completed ?? false,
      history: inspection.history ?? [],
      sale: inspection.sale ?? undefined,
      thumbnail: safeThumbnail(inspection.thumbnail ?? null),
      analysis: inspection.analysis ?? undefined,
      progressSnapshot: stripPhotosFromProgress(
        inspection.progressSnapshot
      ),
      aiInterpretation: inspection.aiInterpretation ?? undefined, // ✅ SAVE AI
    },
    ...existing,
  ];

  try {
    writeWithPrune(updated);
  } catch {
    console.warn("[scanStorage] saveScan failed");
  }
}

export function deleteScan(inspectionId: string) {
  if (typeof window === "undefined") return;
  writeWithPrune(loadScans().filter((i) => i.id !== inspectionId));
}

export function clearAllScans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `inspection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
