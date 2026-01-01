export interface SavedPhotos {
  listing: string[];   // extracted from the listing (up to 8)
  meta: any[];         // optional metadata about photos
}

export interface SavedResult {
  type: "online";
  step: string;
  createdAt: string;

  listingUrl: string | null;

  vehicle: any;
  sections: any[];

  // 🔹 added so all pages can use it safely
  signals?: any[];

  photos: SavedPhotos;

  kilometres: string | number | null;

  isUnlocked: boolean;

  analysisSource?: string;
  source?: string;

  conditionSummary?: string;
  summary?: string;
  notes?: string;
}

const STORAGE_KEY = "carverity_online_result_v3";

export function saveOnlineResults(data: SavedResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
