// src/utils/onlineResults.ts

export interface StoredResult {
  createdAt: string;
  source: "online" | "in-person";
  sections: {
    title: string;
    content: string;
  }[];
}

const STORAGE_KEY = "carverity_online_result";

export function loadOnlineResults(): StoredResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
}

export function saveOnlineResults(result: StoredResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function clearOnlineResults() {
  localStorage.removeItem(STORAGE_KEY);
}
