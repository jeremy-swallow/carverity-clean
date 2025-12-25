/**
 * Online Results Storage
 *
 * Handles saving, loading and clearing the results
 * generated from the online vehicle scan flow.
 */

export interface StoredResult {
  createdAt: string;
  source: "online";
  sections: {
    title: string;
    content: string;
  }[];
}

const STORAGE_KEY = "carverity_online_results";

/**
 * Save results to localStorage
 */
export function saveOnlineResults(results: StoredResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

/**
 * Load saved results (or null if none exist)
 */
export function loadOnlineResults(): StoredResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as StoredResult) : null;
}

/**
 * Clear stored results
 */
export function clearOnlineResults() {
  localStorage.removeItem(STORAGE_KEY);
}
