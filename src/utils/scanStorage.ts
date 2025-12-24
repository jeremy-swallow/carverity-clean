/* =========================================================
   Scan Storage Utility
   Local-only persistence (v2)
========================================================= */

export type ScanType = "online" | "in-person";

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;

  /* NEW — full scan content (v1) */
  concern?: string;
  context?: string;
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

/* Save or update a scan */
export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const filtered = existing.filter((s) => s.id !== scan.id);
  const updated = [scan, ...filtered];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* Get a single scan by id */
export function getScanById(scanId: string): SavedScan | undefined {
  return loadScans().find((s) => s.id === scanId);
}

/* Delete a single scan */
export function deleteScan(scanId: string) {
  const updated = loadScans().filter((s) => s.id !== scanId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/* Clear all scans */
export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

/* Generate unique id */
export function generateScanId() {
  return `scan_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
