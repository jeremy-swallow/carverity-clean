/* =========================================================
   Scan Progress Persistence (upgrade-safe, tolerant fields)
   ========================================================= */

export type ScanProgress = {
  type: "online" | "in-person";
  step: string;

  startedAt?: string;

  // Online scan fields
  listingUrl?: string;

  // Optional vehicle details
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;

    /**
     * Human-readable import status used in the UI
     * e.g. "Sold new in Australia (default)"
     */
    importStatus?: string;

    /**
     * Legacy flag for older flows – kept for safety.
     */
    isImport?: boolean;
  };

  // Optional photos
  photos?: {
    /**
     * Photos taken from the online listing (screenshots, copied images, uploads)
     * Stored as data URLs for now.
     */
    listing?: string[];

    /**
     * Reserved for hash / metadata from authenticity checks
     * Mirrors SavedResult.photos.meta for consistency.
     */
    meta?: any[];

    /**
     * Photos taken during the in-person inspection (future use)
     */
    inPerson?: string[];
  };

  // Free-form condition + notes for AI
  conditionSummary?: string;
  notes?: string;

  // AI analysis (future)
  analysis?: any;

  // Allow unknown fields for forward-compat safety
  [key: string]: any;
};

const STORAGE_KEY = "carverity_scan_progress";

export function loadProgress(): ScanProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScanProgress) : null;
  } catch {
    return null;
  }
}

export function saveProgress(update: Partial<ScanProgress>) {
  const existing = loadProgress() ?? {};
  const merged = { ...existing, ...update };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}
