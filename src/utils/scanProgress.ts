export type ScanJourneyType = "in-person";

export type CheckAnswerValue = "ok" | "concern" | "unsure";

export type CheckAnswer = {
  value: CheckAnswerValue;
  note?: string;
};

export type StepPhoto = {
  id: string;
  dataUrl: string;
  stepId: string;
};

export interface ScanProgress {
  /* =====================
     Journey identity
  ====================== */
  type?: ScanJourneyType;
  scanId?: string;
  step?: string;
  startedAt?: string;

  /* =====================
     Vehicle context
  ====================== */
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  kilometres?: number;

  /* =====================
     Inspection evidence
  ====================== */
  photos?: StepPhoto[];
  checks?: Record<string, CheckAnswer>;

  /* =====================
     Future-safe extension
     (kept intentionally narrow)
  ====================== */
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "carverity_scan_progress_v2";

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
