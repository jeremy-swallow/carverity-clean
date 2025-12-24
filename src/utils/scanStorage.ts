/* =========================================================
   Scan Storage Utility
   Local-only persistence (v1)
========================================================= */

export type ScanType = "online" | "in-person";

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;
  listingUrl?: string;
  summary?: string;
};

const STORAGE_KEY = "carverity_saved_scans";

/* Load all saved scans */
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

/* Save a new scan (most recent first) */
export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const updated = [scan, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* Delete a scan by id */
export function deleteScan(id: string) {
  const updated = loadScans().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* Clear all scans */
export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

/* Generate a simple unique id */
export function generateScanId() {
  return `scan_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
