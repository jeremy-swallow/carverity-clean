/* =========================================================
   Scan Progress Persistence (upgrade-safe)
   Used to resume scans and pass data between steps
   ========================================================= */

export type ScanProgress = {
  type: "online" | "in-person";
  step: string;

  // Timestamps (legacy field — kept for compatibility)
  startedAt?: string;

  // Online scan fields
  listingUrl?: string;

  // Analysis result (v2)
  analysis?: any;

  // Future fields can safely be added here
};

const STORAGE_KEY = "carverity_scan_progress";

export function loadProgress(): ScanProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed as ScanProgress;
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
