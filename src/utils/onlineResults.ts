// src/utils/onlineResults.ts

// ------------------------------
// Shared types
// ------------------------------

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedPhotos {
  listing: string[];
  meta?: any[];
}

// Basic vehicle info used across the online flow
export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
  kilometres?: string | number | null;
  // allow extra fields without TS screaming
  [key: string]: any;
}

// What we store for an online scan
export interface SavedResult {
  type: "online";
  step: string;
  createdAt: string;

  listingUrl: string | null;
  vehicle: VehicleInfo;

  /**
   * High-level confidence from the model.
   * 🟣 Persisted once per scan — never regenerated on reload.
   */
  confidenceCode?: "LOW" | "MODERATE" | "HIGH";

  // Split summaries
  previewSummary?: string | null; // free preview
  fullSummary?: string | null;    // unlocked content

  // Backwards-compat — legacy code may still read this
  summary?: string | null;

  sections: ResultSection[];
  signals?: any[];

  photos: SavedPhotos;
  isUnlocked: boolean;

  // Optional metadata
  source?: string;
  analysisSource?: string;
  sellerType?: string;

  conditionSummary: string;

  kilometres?: number | string;
  owners?: string;
  notes?: string;
}

// ------------------------------
// Storage keys
// ------------------------------

const RESULTS_STORAGE_KEY = "carverity_online_results_v2";
export const LISTING_URL_KEY = "carverity_online_listing_url";

// ------------------------------
// Core save/load for results
// ------------------------------

/**
 * Persists a scan result.
 * 🔒 Confidence code is treated as an immutable value:
 * If a record already has a confidence value, it will not be replaced.
 */
export function saveOnlineResults(data: SavedResult) {
  try {
    const existing = loadOnlineResults();

    // Preserve previously-stored confidenceCode if present
    const confidenceCode =
      existing?.confidenceCode ?? data.confidenceCode ?? "MODERATE";

    const payload: SavedResult = {
      ...data,
      confidenceCode,
      vehicle: normaliseVehicle(data.vehicle ?? {}),
    };

    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Failed to save online results", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedResult;

    // Backwards-compat hydration
    parsed.vehicle = normaliseVehicle(parsed.vehicle ?? {});

    // Stability fallback for old scans with no confidence value
    if (!parsed.confidenceCode) {
      parsed.confidenceCode = "MODERATE";
    }

    return parsed;
  } catch (err) {
    console.error("Failed to load online results", err);
    return null;
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear online results", err);
  }
}

// ------------------------------
// Helpers used by StartScan & others
// (kept for backwards compatibility)
// ------------------------------

export function saveListingUrl(url: string) {
  try {
    localStorage.setItem(LISTING_URL_KEY, url);
  } catch (err) {
    console.error("Failed to save listing URL", err);
  }
}

export function loadListingUrl(): string | null {
  try {
    return localStorage.getItem(LISTING_URL_KEY);
  } catch (err) {
    console.error("Failed to load listing URL", err);
    return null;
  }
}

// ------------------------------
// Vehicle Normaliser
// ------------------------------

export function normaliseVehicle(raw: any): VehicleInfo {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const { make, model, year, kilometres, kms, odo, ...rest } = raw as any;

  const kmValue =
    kilometres ??
    kms ??
    odo ??
    "";

  return {
    make: make ?? "",
    model: model ?? "",
    year: year ?? "",
    kilometres: kmValue ?? "",
    ...rest,
  };
}

/* =========================================================
   Scan Storage Utility
   Local-only persistence (v1)
========================================================= */

export type ScanType = "online" | "in-person";

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;
  listingUrl?: string;
  summary?: string;

  // 👇 Added field (optional so old scans still load)
  completed?: boolean;
};

const STORAGE_KEY = "carverity_saved_scans";

/**
 * Normalises scans — ensures new fields exist
 */
function normalizeScans(scans: any[]): SavedScan[] {
  return scans.map((scan) => ({
    ...scan,
    completed: scan.completed ?? false,
  })) as SavedScan[];
}

export function loadScans(): SavedScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeScans(parsed);
  } catch {
    return [];
  }
}

export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const updated = [
    { completed: false, ...scan },
    ...existing,
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateScanTitle(scanId: string, title: string) {
  const updated = loadScans().map((scan) =>
    scan.id === scanId ? { ...scan, title } : scan
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteScan(scanId: string) {
  const filtered = loadScans().filter((s) => s.id !== scanId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `scan_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
