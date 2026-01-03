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

  // High-level confidence from the model
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

export function saveOnlineResults(data: SavedResult) {
  try {
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save online results", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedResult;

    // Backwards-compat: hydrate missing vehicle fields if needed
    parsed.vehicle = normaliseVehicle(parsed.vehicle ?? {});

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

  const {
    make,
    model,
    year,
    kilometres,
    kms,
    odo,
    ...rest
  } = raw as any;

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
