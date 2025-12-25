// src/utils/onlineResults.ts

export interface StoredResult {
  title: string;
  description: string;
  action?: string;
  confidence?: string;
}

const STORAGE_KEY = "carverity_online_results";

export function saveOnlineResults(results: StoredResult[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch (err) {
    console.error("Failed to save online results:", err);
  }
}

export function loadOnlineResults(): StoredResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredResult[];
  } catch (err) {
    console.error("Failed to load online results:", err);
    return [];
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear online results:", err);
  }
}
