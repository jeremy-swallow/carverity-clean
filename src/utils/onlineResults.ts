// src/utils/onlineResults.ts

/* =========================================================
   Types
========================================================= */

export interface VehicleInfo {
  make: string;
  model: string;
  year: string | number;
  variant?: string | null;
  // allow null + undefined so all callers are happy
  kilometres?: string | number | null | undefined;

  importStatus?: string | null;
  owners?: string | null;
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
  // identity / flow
  type: "online";
  step: string;
  createdAt: string;

  // listing + vehicle
  listingUrl?: string | null;
  vehicle: VehicleInfo;

  // preview + full text
  preview: string;
  previewText?: string;
  fullAnalysis?: string;

  // lock state
  isUnlocked: boolean;

  // structured content
  sections?: ResultSection[];
  signals?: any[];
  photos?: SavedPhotos;

  // confidence metadata
  confidenceCode?: string;
  confidenceAssessment?: string;

  // legacy / optional metadata
  source?: string;
  analysisSource?: string;
  sellerType?: string;
  conditionSummary?: string;
  summary?: string;

  // duplicated for older code paths
  kilometres?: string | number | null | undefined;
  owners?: string;
  notes?: string;

  // safety net so extra fields (like previewText, confidenceCode, etc.)
  // never cause "object literal may only specify known properties" errors
  [key: string]: any;
}

/* =========================================================
   Storage keys
========================================================= */

const STORAGE_KEY = "carverity_online_results_v3";
const LISTING_URL_KEY = "carverity_online_listing_url";

/* =========================================================
   Results storage
========================================================= */

export function saveOnlineResults(data: SavedResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOnlineResults(): SavedResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SavedResult;
  } catch {
    return null;
  }
}

/* =========================================================
   Listing URL helpers (Start + Analyzing pages)
========================================================= */

export function saveListingUrl(url: string) {
  localStorage.setItem(LISTING_URL_KEY, url);
}

export function loadListingUrl(): string | null {
  return localStorage.getItem(LISTING_URL_KEY);
}

/* =========================================================
   Normalisers
========================================================= */

export function normaliseKilometres(km?: string | number | null) {
  if (km === undefined || km === null || km === "") return null;

  const n =
    typeof km === "string" ? parseInt(km.replace(/\D/g, ""), 10) : km;

  if (isNaN(n)) return null;
  return `${n.toLocaleString()} km`;
}

export function normaliseVehicle(v: VehicleInfo): VehicleInfo {
  const formattedKm = normaliseKilometres(v.kilometres ?? null);

  return {
    ...v,
    kilometres: formattedKm ?? null,
    variant: v.variant || "—",
  };
}
