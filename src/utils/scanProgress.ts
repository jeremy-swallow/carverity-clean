/* =========================================================
   Scan Progress Persistence (upgrade-safe, tolerant fields)
   ========================================================= */

export type ScanProgress = {
  type: "online" | "in-person";
  step: string;

  // Timestamps (legacy / compatibility)
  startedAt?: string;

  // Online scan fields
  listingUrl?: string;

  // AI analysis (v2)
  analysis?: any;

  // 👇 Safety — allow unknown fields from older screens
  // (prevents TS build failures during upgrades)
  [key: string]: any;
};

const STORAGE_KEY = "carverity_scan_progress";

export function loadProgress(): ScanProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as ScanProgress;
  } catch {
    return null;
  }
}

export function saveProgress(progress: Partial<ScanProgress>) {
  const existing = loadProgress() ?? {};
  const merged = { ...existing, ...progress };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
