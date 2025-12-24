/* =========================================================
   Scan Storage Utility
   Local-only persistence (v3)
========================================================= */

export type ScanType = "online" | "in-person";

export type AIScanInsight = {
  summary: string;
  focusPoints: string[];
  confidence: "low" | "medium" | "high";
};

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;

  /* Context */
  concern?: string;
  context?: string;

  /* Human summary (non-AI / v1 content) */
  summary?: string;

  /* AI output (v1) */
  aiInsight?: AIScanInsight;
};

const STORAGE_KEY = "carverity_saved_scans";

/* Load all scans */
export function loadScans(): SavedScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedScan[];
  } catch {
    return [];
  }
}

/* Save or update scan */
export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const filtered = existing.filter((s) => s.id !== scan.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([scan, ...filtered]));
}

/* Get scan by id */
export function getScanById(id: string) {
  return loadScans().find((s) => s.id === id);
}

/* Delete one scan */
export function deleteScan(id: string) {
  const updated = loadScans().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* Clear all */
export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

/* Generate id */
export function generateScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
