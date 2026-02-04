export type ScanJourneyType = "in-person" | "online";

export type CheckAnswerValue = "ok" | "concern" | "unsure";

export type CheckAnswer = {
  value: CheckAnswerValue;
  note?: string;
};

export type StepPhoto = {
  id: string;
  /**
   * Supabase Storage object path (NOT a public URL)
   * Example: users/{userId}/scans/{scanId}/steps/{stepId}/{photoId}.jpg
   */
  storagePath: string;
  stepId: string;
};

export type FollowUpPhoto = {
  id: string;
  /**
   * Supabase Storage object path (NOT a public URL)
   */
  storagePath: string;
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
     In-person: sale context
  ====================== */
  saleType?: "dealership" | "private";
  saleName?: string;
  saleSuburb?: string;

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

/**
 * ONLY treat the scan as completed on true terminal pages.
 * Decision, summary, negotiation, and price positioning
 * are NOT terminal and must NOT clear progress.
 */
function isCompletedStep(step: unknown): boolean {
  return step === "/scan/in-person/results/final";
}

/**
 * Load scan progress from localStorage.
 * Clears ONLY if the scan is:
 *  - truly completed
 *  - or expired
 */
export function loadProgress(): ScanProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = safeParseJSON(raw);
    if (!isRecord(parsed)) return null;

    const progress = parsed as ScanProgress;

    if (isCompletedStep(progress.step)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (isExpired(progress)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return progress;
  } catch {
    return null;
  }
}

/**
 * Merge partial updates into existing progress.
 * Preserves all previously collected data.
 */
export function saveProgress(update: Partial<ScanProgress>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = loadProgress() ?? {};

    const merged: ScanProgress = {
      ...existing,
      ...update,
      startedAt:
        existing.startedAt || update.startedAt || new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Clear any active scan.
 */
export function clearProgress(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Start a brand-new scan.
 * This is the ONLY place we intentionally wipe progress.
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
    // ignore
  }
}
