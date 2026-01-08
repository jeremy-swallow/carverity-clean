/* =========================================================
   Scan Storage Utility
   Local-only persistence (v1)
========================================================= */

export type ScanType = "online" | "in-person";

export interface ScanHistoryEvent {
  at: string;
  event: string;
}

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;

  listingUrl?: string;
  summary?: string;

  // Vehicle identity (used for pairing & display)
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
  };

  // In-person + cross-scan metadata
  fromOnlineScan?: boolean;
  completed?: boolean;

  // Activity timeline
  history?: ScanHistoryEvent[];
};

const STORAGE_KEY = "carverity_saved_scans";

/**
 * Normalises scans — ensures new optional fields exist
 */
function normalizeScans(scans: any[]): SavedScan[] {
  return scans.map((scan) => ({
    completed: false,
    history: [],
    ...scan,
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
  const existing = loadScans().filter((s) => s.id !== scan.id);

  const updated = [
    {
      completed: false,
      history: [],
      ...scan,
    },
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
