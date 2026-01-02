// src/utils/onlineResults.ts

// ---------- Shared types ----------

export interface ResultSection {
  title: string;
  content: string;
}

export interface ListingPhotos {
  listing: string[];
  meta?: any[];
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string | number;
  variant?: string;
  kilometres?: string | number | null;
  importStatus?: string;
  owners?: string;
}

export interface SavedResult {
  type: "online";
  step: string;
  createdAt: string;

  listingUrl: string | null;

  vehicle: VehicleInfo;

  // Some older code stores kms here too
  kilometres?: string | number | null;

  // Text blocks
  previewText?: string;
  fullAnalysis?: string;

  summary?: string;
  conditionSummary?: string;
  notes?: string;

  sections?: ResultSection[];
  signals?: any[];
  photos?: ListingPhotos;

  confidenceCode?: "LOW" | "MODERATE" | "HIGH" | string | null;
  confidenceSummary?: string;

  // Model + pipeline metadata
  source?: string;
  analysisSource?: string;

  isUnlocked: boolean;
}

// ---------- Storage keys ----------

const STORAGE_KEY = "carverity_online_results_v2";
const LISTING_URL_KEY = "carverity_online_listing_url";

// ---------- Storage helpers ----------

export function saveOnlineResults(data: SavedResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOnlineResults(): SavedResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedResult) : null;
}

export function clearOnlineResults() {
  localStorage.removeItem(STORAGE_KEY);
}

export function saveListingUrl(url: string) {
  localStorage.setItem(LISTING_URL_KEY, url);
}

export function loadListingUrl(): string | null {
  return localStorage.getItem(LISTING_URL_KEY);
}

// ---------- Normalisers ----------

export function normaliseKilometres(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "—";
  const n =
    typeof value === "string"
      ? parseInt(value.replace(/\D/g, ""), 10)
      : value;
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-AU") + " km";
}

// Kept for older callers – safe normalisation of vehicle block
export function normaliseVehicle(
  vehicle: VehicleInfo | null | undefined
): VehicleInfo {
  if (!vehicle) return {};
  const v: VehicleInfo = { ...vehicle };

  if (v.kilometres !== null && v.kilometres !== undefined && v.kilometres !== "") {
    const n =
      typeof v.kilometres === "string"
        ? parseInt(v.kilometres.replace(/\D/g, ""), 10)
        : v.kilometres;
    if (!isNaN(n)) v.kilometres = n;
  }

  return v;
}
