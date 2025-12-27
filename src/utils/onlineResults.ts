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

    return {
      createdAt: parsed.createdAt ?? "",
      source: parsed.source ?? "online",
      sellerType: parsed.sellerType ?? "unknown",
      listingUrl: parsed.listingUrl ?? "",
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      analysisSource: parsed.analysisSource ?? "live",
    };
  } catch (err) {
    console.error("Failed to load results:", err);
    return null;
  }
}
