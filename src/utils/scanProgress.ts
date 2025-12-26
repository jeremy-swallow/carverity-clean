/* =========================================================
   Scan Progress — Local-only persistence (v1)
   Upgrade-safe and backward-compatible
   ========================================================= */

const STORAGE_KEY = "carverity_scan_progress";

/**
 * Central scan progress shape.
 * Optional fields allow different steps to store only what
 * they need without breaking older or future steps.
 */
export type ScanProgress = {
  type: "online" | "in-person";
  step: string;

  // Common metadata (some flows already use these)
  startedAt?: string;
  completedAt?: string;

  // Online scan fields
  listingUrl?: string;

  // In-person scan fields (future-safe)
  vehicleTitle?: string;
  odometer?: string;
  photos?: string[];
};

/** Load current progress (safe fallback) */
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

/** Save progress to storage */
export function saveProgress(progress: ScanProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/** Clear progress entirely */
export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
