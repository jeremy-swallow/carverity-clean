/* =========================================================
   Online Scan Results — Persistent storage (v2, upgrade-safe)
   ========================================================= */

export interface SavedResult {
  createdAt: string;
  source: "online" | "in-person";
  sellerType: string;
  listingUrl: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;

  /** 🔓 Added in v2 — track unlock state without charging credits again */
  isUnlocked?: boolean;
}

const STORAGE_KEY = "onlineResults";

/** Save result safely (upgrade-safe, never writes invalid data) */
export function saveOnlineResults(result: SavedResult) {
  if (!result || typeof result !== "object") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

/** Load result with compatibility defaults */
export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedResult>;

    return {
      createdAt: parsed.createdAt ?? "",
      source: parsed.source ?? "online",
      sellerType: parsed.sellerType ?? "unknown",
      listingUrl: parsed.listingUrl ?? "",
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      analysisSource: parsed.analysisSource,
      isUnlocked: parsed.isUnlocked ?? false,
    };
  } catch {
    return null;
  }
}

/** 🔓 Mark an existing result as unlocked — no extra credit used */
export function unlockOnlineResults() {
  const existing = loadOnlineResults();
  if (!existing) return;

  const updated: SavedResult = {
    ...existing,
    isUnlocked: true,
  };

  saveOnlineResults(updated);
}
