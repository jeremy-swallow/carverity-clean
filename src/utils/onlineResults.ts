// src/utils/onlineResults.ts

// Basic vehicle shape used by online scans.
// This is kept local to this file so we don’t depend on vehicleDetails.ts.
export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string | number;
  variant?: string;
  kilometres?: string | number | null;
  importStatus?: string;
}

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedPhotos {
  listing: string[];
  meta?: any[];
}

export interface SavedResult {
  // core metadata
  type: "online";
  step: string;
  createdAt: string;

  // listing + vehicle
  listingUrl: string | null;
  vehicle: VehicleInfo;

  // structured analysis
  sections: ResultSection[];
  photos: SavedPhotos;
  signals?: any[]; // optional, used by OnlineReport.tsx

  // preview + full text
  // (we keep both names so older code still compiles)
  preview?: string;
  previewText?: string;
  fullAnalysis?: string;

  // summary fields
  summary?: string;
  conditionSummary?: string;
  notes?: string;

  // numeric bits
  kilometres?: string | number | null;
  isUnlocked?: boolean;

  // confidence banner
  confidenceCode?: string | null;
  confidenceSummary?: string;
  confidenceAssessment?: string;
}

// storage keys
const STORAGE_KEY = "carverity_online_results_v3";
const LISTING_URL_KEY = "carverity_online_listing_url";

/* =========================================================
   Save / load full online scan result
========================================================= */

export function saveOnlineResults(result: SavedResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch (err) {
    console.error("❌ Failed to save online results", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedResult;
  } catch (err) {
    console.error("❌ Failed to load online results", err);
    return null;
  }
}

/* =========================================================
   Save / load listing URL (used by OnlineStart / StartScan /
   OnlineAnalyzing to pass the URL between pages)
========================================================= */

export function saveListingUrl(url: string) {
  try {
    localStorage.setItem(LISTING_URL_KEY, url);
  } catch (err) {
    console.error("❌ Failed to save listing URL", err);
  }
}

export function loadListingUrl(): string | null {
  try {
    return localStorage.getItem(LISTING_URL_KEY);
  } catch (err) {
    console.error("❌ Failed to load listing URL", err);
    return null;
  }
}

/* =========================================================
   Normalisers
========================================================= */

export function normaliseKilometres(
  km: string | number | null | undefined
): string | number | null {
  if (km == null || km === "") return null;

  if (typeof km === "number") {
    return `${km.toLocaleString()} km`;
  }

  const n = parseInt(km.replace(/\D/g, ""), 10);
  if (isNaN(n)) return null;
  return `${n.toLocaleString()} km`;
}

export function normaliseVehicle(v: VehicleInfo = {}): VehicleInfo {
  return {
    ...v,
    kilometres: normaliseKilometres(v.kilometres),
    variant: v.variant ?? "—",
  };
}
