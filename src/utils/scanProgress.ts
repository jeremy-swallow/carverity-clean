// src/utils/scanProgress.ts

export type ScanJourneyType = "online" | "in-person";

export interface ScanProgress {
  type?: ScanJourneyType;
  step?: string;
  startedAt?: string;

  // In-person journey identity
  scanId?: string;
  linkedOnlineScanId?: string | null;
  fromOnlineScan?: boolean;

  // In-person data
  imperfections?: any[];
  followUpPhotos?: any[];
  checks?: Record<string, string>;
  photos?: string[];
  photoStepIndex?: number;

  // Future / online journey fields can also live here
  [key: string]: unknown;
}

const STORAGE_KEY = "carverity_scan_progress_v1";

/**
 * Safely load the current scan progress from localStorage.
 */
export function loadProgress(): ScanProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed as ScanProgress;
  } catch {
    return null;
  }
}

/**
 * Merge the provided partial progress into the existing stored state.
 * This keeps fields from previous steps intact.
 */
export function saveProgress(update: Partial<ScanProgress>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = loadProgress() ?? {};
    const merged: ScanProgress = {
      ...existing,
      ...update,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors (e.g. quota exceeded)
  }
}

/**
 * Clear any active scan journey.
 */
export function clearProgress(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
