/* =========================================================
   Scan Progress — Local-only persistence (v1)
   ========================================================= */

const STORAGE_KEY = "carverity_scan_progress";

/**
 * Type describing in-progress scan state.
 * Optional fields allow different scan types to store
 * only what they need without breaking older data.
 */
export type ScanProgress = {
  type: "online" | "in-person";
  step: string;

  // Optional — used for online listing scans
  listingUrl?: string;
};

/** Load current progress (or null) */
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

/** Save progress (upgrade-safe) */
export function saveProgress(progress: ScanProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Clear progress when user finishes or starts fresh */
export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
