export type ScanType = "online" | "in-person";

export type ScanProgress = {
  type: ScanType;
  step: string;       // route path like "/scan/online/kilometres"
  startedAt: string;  // ISO string
  updatedAt: string;  // ISO string
};

const STORAGE_KEY = "carverity_scan_progress_v1";

/**
 * Save scan progress (single active scan).
 */
export function saveProgress(input: Omit<ScanProgress, "updatedAt">) {
  const progress: ScanProgress = {
    ...input,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

/**
 * Load scan progress (returns null if missing/corrupt).
 */
export function loadProgress(): ScanProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ScanProgress>;

    if (
      !parsed ||
      (parsed.type !== "online" && parsed.type !== "in-person") ||
      typeof parsed.step !== "string" ||
      typeof parsed.startedAt !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }

    // Basic route safety: must be an app path
    if (!parsed.step.startsWith("/")) return null;

    return parsed as ScanProgress;
  } catch {
    return null;
  }
}

/**
 * Clear scan progress.
 */
export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
