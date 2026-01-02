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

const RESULTS_KEY = "carverity_online_results_v2";
const LISTING_URL_KEY = "carverity_online_listing_url";

/* ===========================
   RESULTS STORAGE
=========================== */

export function saveOnlineResults(data: SavedResult) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("❌ Failed to save online results", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as SavedResult) : null;
  } catch (err) {
    console.error("❌ Failed to parse stored online results", err);
    return null;
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(RESULTS_KEY);
  } catch (err) {
    console.error("❌ Failed to clear online results", err);
  }
}

/* ===========================
   LISTING URL (CANONICAL)
=========================== */

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
  } catch {
    return null;
  }
}

export function clearListingUrl() {
  try {
    localStorage.removeItem(LISTING_URL_KEY);
  } catch {}
}
