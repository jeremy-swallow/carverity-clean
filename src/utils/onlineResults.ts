// src/utils/onlineResults.ts

export interface SavedResult {
  createdAt: string;
  source: "online" | "in-person";
  sellerType: string;
  listingUrl: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;
}

const STORAGE_KEY = "onlineResults";

export function saveOnlineResults(result: SavedResult | Partial<SavedResult>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadOnlineResults(): SavedResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedResult) : null;
}

export function clearOnlineResults() {
  localStorage.removeItem(STORAGE_KEY);
}
