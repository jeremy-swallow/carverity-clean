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

// Alias so older code that imports StoredResult still compiles
export type StoredResult = SavedResult;

const STORAGE_KEY = "onlineResults";

export function saveOnlineResults(result: SavedResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch (err) {
    console.error("Failed to save results:", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    const normalized: SavedResult = {
      createdAt: parsed.createdAt ?? "",
      source: parsed.source === "in-person" ? "in-person" : "online",
      sellerType: parsed.sellerType ?? "unknown",
      listingUrl: parsed.listingUrl ?? "",
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      analysisSource: parsed.analysisSource ?? "live",
    };

    return normalized;
  } catch (err) {
    console.error("Failed to load results:", err);
    return null;
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear results:", err);
  }
}
