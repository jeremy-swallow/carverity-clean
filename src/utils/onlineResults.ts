// src/utils/onlineResults.ts

// ------------------------------
// Types
// ------------------------------

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedPhotos {
  listing: string[];
  meta?: any[];
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string | number;
  kilometres?: string | number | null;
  variant?: string;
  importStatus?: string;
}

export interface SavedResult {
  // Core metadata
  type: "online";
  step: string;
  createdAt: string;

  // Listing
  listingUrl: string | null;
  vehicle: VehicleInfo;

  // Content sections + photos
  sections: ResultSection[];
  photos: SavedPhotos;

  // Lock state
  isUnlocked: boolean;

  // Optional metadata
  source?: string;
  analysisSource?: string;
  sellerType?: string;

  // High-level summaries
  summary?: string;
  conditionSummary?: string;
  notes?: string;

  kilometres?: string | number | null;
  owners?: string;

  // 🔐 Preview vs full analysis split
  previewSummary?: string; // short, non-actionable preview used on free tier
  previewText?: string;    // legacy / fallback preview
  fullAnalysis?: string;   // detailed paid analysis

  // Confidence / trust signals
  confidenceCode?: string | null;
  confidenceSummary?: string;
  confidenceAssessment?: string;

  // Structured risk / signal data (optional, for future use)
  signals?: any[];
}

// ------------------------------
// Storage keys
// ------------------------------

const STORAGE_KEY = "carverity_online_results_v2";
const LISTING_URL_KEY = "carverity_online_listing_url";

// ------------------------------
// Listing URL helpers
// ------------------------------

export function saveListingUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LISTING_URL_KEY, url);
  } catch (err) {
    console.error("❌ Failed to save listing URL:", err);
  }
}

export function loadListingUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LISTING_URL_KEY);
  } catch (err) {
    console.error("❌ Failed to load listing URL:", err);
    return null;
  }
}

// ------------------------------
// Result storage helpers
// ------------------------------

export function saveOnlineResults(data: SavedResult) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("❌ Failed to save online results:", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SavedResult;
    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse online results:", err);
    return null;
  }
}

// ------------------------------
// Normalisers
// ------------------------------

export function normaliseKilometres(
  km?: string | number | null
): string | null {
  if (km === undefined || km === null || km === "") return null;

  const n =
    typeof km === "string" ? parseInt(km.replace(/\D/g, ""), 10) : km;

  if (Number.isNaN(n)) return null;

  return n.toLocaleString("en-AU") + " km";
}

export function normaliseVehicle(v: VehicleInfo): VehicleInfo {
  const formattedKm = normaliseKilometres(v.kilometres);

  return {
    ...v,
    kilometres: formattedKm ?? null,
    variant: v.variant || "—",
  };
}
