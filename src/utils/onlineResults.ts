/* src/utils/onlineResults.ts */

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedResult {
  type: "online";

  step: string;
  createdAt: string;

  listingUrl: string | null;
  vehicle: any;

  // Free preview summary
  summary?: string;
  conditionSummary?: string;

  // Unlocked full scan body
  fullText?: string;

  // Optional structured sections support (legacy)
  sections?: ResultSection[];

  kilometres?: string | number | null;

  isUnlocked: boolean;
}

const STORAGE_KEY = "carverity_online_results_v2";

export function saveOnlineResults(data: SavedResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadOnlineResults(): SavedResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as SavedResult;
}

export function clearOnlineResults() {
  localStorage.removeItem(STORAGE_KEY);
}
