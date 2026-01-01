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

  // Summaries
  conditionSummary: string;
  summary?: string;

  // Extra fields we want to carry through the flow
  kilometres?: string | number | null;
  owners?: string;
  notes?: string;
}

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
