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

  // 👇 Added field (optional so old scans still load)
  completed?: boolean;
};

const STORAGE_KEY = "carverity_saved_scans";

/**
 * Normalises scans — ensures new fields exist
 */
function normalizeScans(scans: any[]): SavedScan[] {
  return scans.map((scan) => ({
    ...scan,
    // 👇 If missing, default to false
    completed: scan.completed ?? false,
  })) as SavedScan[];
}

export function loadScans(): SavedScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeScans(parsed);
  } catch {
    return [];
  }
}

export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const updated = [
    // ensure saved scans always include field
    { completed: false, ...scan },
    ...existing,
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateScanTitle(scanId: string, title: string) {
  const updated = loadScans().map((scan) =>
    scan.id === scanId ? { ...scan, title } : scan
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteScan(scanId: string) {
  const filtered = loadScans().filter((s) => s.id !== scanId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `scan_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
