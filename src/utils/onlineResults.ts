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
  type: "online";
  step: string;
  createdAt: string;

  listingUrl: string | null;
  vehicle: any;

  sections: ResultSection[];
  signals?: any[];

  photos: SavedPhotos;

  isUnlocked: boolean;

  source?: string;
  analysisSource?: string;
  sellerType?: string;

  confidenceCode?: "LOW" | "MODERATE" | "HIGH" | null;

  conditionSummary: string;
  summary?: string;

  kilometres?: string | number | null;
  owners?: string;
  notes?: string;
}

const STORAGE_KEY = "carverity_online_results_v2";
const LISTING_URL_KEY = "carverity_online_listing_url";

/* ---------------------------
   RESULTS STORAGE
---------------------------- */
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

/* ---------------------------
   LISTING URL STORAGE
---------------------------- */
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
