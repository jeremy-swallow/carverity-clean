/* src/utils/onlineResults.ts */

export interface PhotoHashMeta {
  index: number;
  hash: string;
  approxSizeKB?: number;
}

export interface SavedResultPhotos {
  /** Base64 listing images for UI + lightbox */
  listing: string[];

  /** Hash metadata used for transparency & authenticity checks */
  meta: PhotoHashMeta[];
}

export interface SavedResultVehicle {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  importStatus?: string;
}

export interface SavedResult {
  createdAt: string;
  source: "online" | "in-person";
  sellerType: string;
  listingUrl: string;

  // Core AI output
  summary?: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;

  // Extra context
  vehicle?: SavedResultVehicle;
  kilometres?: string | null;
  owners?: string | null;
  conditionSummary?: string;
  notes?: string;

  /** New unified photos structure */
  photos: SavedResultPhotos;

  /** Prevent double-charging unlocks */
  isUnlocked?: boolean;

  // Forward-compat escape hatch
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
