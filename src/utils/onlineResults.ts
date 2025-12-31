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

  // Optional metadata
  source?: string;
  analysisSource?: string;
  sellerType?: string;

  conditionSummary: string;
  summary?: string;

  kilometres?: number | string;
  owners?: string;
  notes?: string;
}

const STORAGE_KEY = "carverity_online_results_v2";

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

export function unlockOnlineResults() {
  const stored = loadOnlineResults();
  if (!stored) return;

  stored.isUnlocked = true;
  saveOnlineResults(stored);
}
