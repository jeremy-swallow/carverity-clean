export interface SavedResultPhotos {
  listing: string[]; // base64 images
  meta?: any[];      // metadata hashes
}

export interface SavedResultVehicle {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  importStatus?: string;
  kilometres?: string;
  owners?: string | null;
}

export interface SavedResult {
  createdAt: string;
  source: "online" | "in-person";
  sellerType: string;
  listingUrl: string;

  summary?: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;

  vehicle?: SavedResultVehicle;
  conditionSummary?: string;
  notes?: string;

  photos?: SavedResultPhotos;

  isUnlocked?: boolean;

  [key: string]: any;
}

const STORAGE_KEY = "onlineResults";

export function saveOnlineResults(result: SavedResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadOnlineResults(): SavedResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SavedResult) : null;
}

export function unlockOnlineResults() {
  const existing = loadOnlineResults();
  if (!existing) return;
  const updated: SavedResult = { ...existing, isUnlocked: true };
  saveOnlineResults(updated);
}
