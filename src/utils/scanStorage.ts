/* =========================================================
   Inspection Storage Utility
   Local-only persistence (in-person only)
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

  // Thumbnail image (base64 dataUrl)
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
   * NEW: Persisted analysis output for reload-safe results.
   * This is generated at the moment report generation begins.
   */
  analysis?: AnalysisResult;

  /**
   * NEW: Persisted progress snapshot at the time of report generation.
   * This ensures the report is reproducible and print-safe.
   */
  progressSnapshot?: ScanProgress;
}

const STORAGE_KEY = "carverity_saved_inspections";

/* =========================================================
   Normalisation — keeps older saved records safe
========================================================= */

function normaliseInspections(records: any[]): SavedInspection[] {
  return records.map((record) => ({
    ...record,
    type: "in-person",
    createdAt: record.createdAt || record.created_at || new Date().toISOString(),
    title: record.title || "In-person inspection",
    completed: record.completed ?? false,
    history: record.history ?? [],
    thumbnail: record.thumbnail ?? null,
    analysis: record.analysis ?? undefined,
    progressSnapshot: record.progressSnapshot ?? undefined,
  })) as SavedInspection[];
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

  const updated: SavedInspection[] = [
    {
      ...inspection,
      type: "in-person",
      title: inspection.title || "In-person inspection",
      createdAt: inspection.createdAt || new Date().toISOString(),
      completed: inspection.completed ?? false,
      history: inspection.history ?? [],
      thumbnail: inspection.thumbnail ?? null,
      analysis: inspection.analysis ?? undefined,
      progressSnapshot: inspection.progressSnapshot ?? undefined,
    },
    ...existing,
  ];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateScanTitle(inspectionId: string, title: string) {
  if (typeof window === "undefined") return;

  const updated = loadScans().map((inspection) =>
    inspection.id === inspectionId ? { ...inspection, title } : inspection
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteScan(inspectionId: string) {
  if (typeof window === "undefined") return;

  const filtered = loadScans().filter((i) => i.id !== inspectionId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllScans() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `inspection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
