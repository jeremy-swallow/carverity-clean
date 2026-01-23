// src/utils/scanProgress.ts

export type ScanJourneyType = "in-person" | "online";

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

export type FollowUpPhoto = {
  id: string;
  dataUrl: string;
  note?: string;
};

export type Imperfection = {
  id: string;
  label?: string;
  severity?: "minor" | "moderate" | "major";
  location?: string;
  note?: string;
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
  vehicleVariant?: string;
  vehicleKms?: number;
  kilometres?: number;

  /* =====================
     In-person: pricing context
  ====================== */
  askingPrice?: number | null;

  /* =====================
     Inspection evidence
  ====================== */
  photos?: StepPhoto[];
  followUpPhotos?: FollowUpPhoto[];
  checks?: Record<string, CheckAnswer>;
  imperfections?: Imperfection[];

  /* =====================
     Flow flags
  ====================== */
  fromOnlineScan?: boolean;

  /* =====================
     Future-safe extension
  ====================== */
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "carverity_scan_progress_v2";

/**
 * How long a scan can be "resumable" before we auto-clear it.
 * This prevents old/stale scans from confusing users.
 */
const PROGRESS_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function safeParseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isExpired(progress: ScanProgress | null): boolean {
  if (!progress?.startedAt) return false;

  const started = new Date(progress.startedAt).getTime();
  if (!Number.isFinite(started)) return false;

  return Date.now() - started > PROGRESS_TTL_MS;
}

function isCompletedStep(step: unknown): boolean {
  const s = String(step ?? "");
  if (!s) return false;

  // If progress.step is already on an end-of-flow page,
  // we should not offer "resume" and we should clear it.
  const completedStepPrefixes = [
    "/scan/in-person/results",
    "/scan/in-person/print",
    "/scan/in-person/decision",
    "/scan/in-person/price-positioning",
    "/scan/online/results",
    "/scan/online/report",
  ];

  return completedStepPrefixes.some((p) => s.startsWith(p));
}

/**
 * Safely load the current scan progress from localStorage.
 * Auto-clears stale or completed progress so users don't get "stuck"
 * resuming an old scan forever.
 */
export function loadProgress(): ScanProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = safeParseJSON(raw);
    if (!isRecord(parsed)) return null;

    const progress = parsed as ScanProgress;

    // Auto-clear if it points to a completed page
    if (isCompletedStep(progress.step)) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return null;
    }

    // Auto-clear if too old (stale scan)
    if (isExpired(progress)) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return null;
    }

    return progress;
  } catch {
    return null;
  }
}

/**
 * Merge the provided partial progress into the existing stored state.
 * This keeps fields from previous steps intact.
 *
 * Also ensures startedAt is set once, so we can expire stale scans.
 */
export function saveProgress(update: Partial<ScanProgress>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = loadProgress() ?? {};

    const merged: ScanProgress = {
      ...existing,
      ...update,
      startedAt: existing.startedAt || update.startedAt || new Date().toISOString(),
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

/**
 * Hard reset scan progress and immediately start a new journey.
 * Use this when user taps "Start scan" so we never resume old data.
 */
export function startFreshProgress(
  type: ScanJourneyType,
  firstStep: string,
  scanId?: string
): void {
  if (typeof window === "undefined") return;

  try {
    const fresh: ScanProgress = {
      type,
      step: firstStep,
      scanId,
      startedAt: new Date().toISOString(),
      photos: [],
      followUpPhotos: [],
      checks: {},
      imperfections: [],
      meta: {},
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // Ignore errors
  }
}
