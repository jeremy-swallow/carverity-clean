// src/utils/onlineResults.ts

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedPhotos {
  listing: string[];
  meta?: any[];
}

export interface SavedResult {
  // literal type so TS knows this is an online scan
  type: "online";

  // where in the flow the user currently is
  step: string;

  // ISO timestamp of when this result was created
  createdAt: string;

  // listing + vehicle basics
  listingUrl: string | null;
  vehicle: any;

  // AI / analysis output
  sections: ResultSection[];
  signals?: any[];

  // listing photos
  photos: SavedPhotos;

  // gating
  isUnlocked: boolean;

  // Optional metadata
  source?: string;
  analysisSource?: string;
  sellerType?: string;

  // Confidence from backend AI
  confidenceCode?: "LOW" | "MODERATE" | "HIGH" | null;

  // Summaries
  conditionSummary: string;
  summary?: string;

  // Extra fields we want to carry through the flow
  kilometres?: string | number | null;
  owners?: string;
  notes?: string;
}

/* =========================================================
   RESULT STORAGE
========================================================= */

const STORAGE_KEY = "carverity_online_results_v2";

export function saveOnlineResults(data: SavedResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    console.error("❌ Failed to parse stored online results", err);
    return null;
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("❌ Failed to clear online results", err);
  }
}

/* =========================================================
   LISTING URL STORAGE (scan input seed)
========================================================= */

export const LISTING_URL_KEY = "carverity_online_listing_url";

export function saveListingUrl(url: string) {
  try {
    localStorage.setItem(LISTING_URL_KEY, url);
  } catch (err) {
    console.error("❌ Failed to store listing URL", err);
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

export function clearListingUrl() {
  try {
    localStorage.removeItem(LISTING_URL_KEY);
  } catch (err) {
    console.error("❌ Failed to clear listing URL", err);
  }
}
