// src/utils/onlineResults.ts

// Shape of what we store for an online (or in-person) scan result
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

    // Normalise / guard against missing or bad data
    const normalised: SavedResult = {
      createdAt: parsed.createdAt ?? "",
      source: parsed.source === "in-person" ? "in-person" : "online",
      sellerType: parsed.sellerType ?? "unknown",
      listingUrl: parsed.listingUrl ?? "",
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      analysisSource: parsed.analysisSource ?? "ai",
    };

    return normalised;
  } catch (err) {
    console.error("Failed to load results:", err);
    return null;
  }
}
