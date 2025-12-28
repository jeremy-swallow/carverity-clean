/* src/utils/onlineResults.ts */

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

  // Core AI output
  summary?: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;

  // Extra context
  vehicle?: SavedResultVehicle;
  conditionSummary?: string;
  notes?: string;

  /** v2 flag — track unlock state so user doesn’t spend a second credit */
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
