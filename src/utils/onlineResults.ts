/* =========================================================
   CarVerity — Unified Local Persistence Layer (v3)
   - Device-scoped storage (no login required)
   - Forward-compatible for future account sync
   - Backwards-compatible with older scan data
========================================================= */

const DEVICE_ID_KEY = "carverity_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    const generated =
      (typeof crypto !== "undefined" &&
        (crypto as any).randomUUID &&
        (crypto as any).randomUUID()) ||
      `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    id = String(generated);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/* ===============================
   Online Scan Types
================================ */

export interface ResultSection {
  title: string;
  content: string;
}

export interface SavedPhotos {
  listing: string[];
  meta?: any[];
}

export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: string;
  kilometres?: string | number | null;
  [key: string]: any;
}

export type ConfidenceLevel = "LOW" | "MODERATE" | "HIGH";

export interface SavedResult {
  id?: string;

  type: "online";
  step: string;
  createdAt: string;

  deviceId?: string;

  listingUrl: string | null;
  vehicle: VehicleInfo;

  confidenceCode?: ConfidenceLevel;

  previewSummary?: string | null;
  fullSummary?: string | null;

  summary?: string | null;

  sections: ResultSection[];
  signals?: any[];

  photos: SavedPhotos;

  isUnlocked: boolean;
  inProgress?: boolean;
  completed?: boolean;

  source?: string;
  analysisSource?: string;
  sellerType?: string;

  conditionSummary: string;

  kilometres?: number | string;
  owners?: string;
  notes?: string;
}

/* ===============================
   Storage Keys
================================ */

const RESULTS_STORAGE_KEY = "carverity_online_results_v3";
export const LISTING_URL_KEY = "carverity_online_listing_url";

/* ===============================
   Vehicle Normaliser
================================ */

export function normaliseVehicle(raw: any): VehicleInfo {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const { make, model, year, kilometres, kms, odo, ...rest } = raw as any;
  const kmValue = kilometres ?? kms ?? odo ?? "";

  return {
    make: make ?? "",
    model: model ?? "",
    year: year ?? "",
    kilometres: kmValue ?? "",
    ...rest,
  };
}

/* ===============================
   Result Normaliser
================================ */

function normaliseResult(record: any): SavedResult {
  const deviceId = record.deviceId ?? getDeviceId();

  return {
    ...record,
    deviceId,
    inProgress: record.inProgress ?? false,
    completed: record.completed ?? false,
    vehicle: normaliseVehicle(record.vehicle ?? {}),
  };
}

/* ===============================
   Core save/load for results
================================ */

export function saveOnlineResults(data: SavedResult) {
  try {
    const normalised = normaliseResult({
      ...data,
      deviceId: data.deviceId ?? getDeviceId(),
    });

    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(normalised));
  } catch (err) {
    console.error("Failed to save online results", err);
  }
}

export function loadOnlineResults(): SavedResult | null {
  try {
    const raw = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedResult;
    return normaliseResult(parsed);
  } catch (err) {
    console.error("Failed to load online results", err);
    return null;
  }
}

export function clearOnlineResults() {
  try {
    localStorage.removeItem(RESULTS_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear online results", err);
  }
}

/* ===============================
   Helpers
================================ */

export function saveListingUrl(url: string) {
  try {
    localStorage.setItem(LISTING_URL_KEY, url);
  } catch (err) {
    console.error("Failed to save listing URL", err);
  }
}

export function loadListingUrl(): string | null {
  try {
    return localStorage.getItem(LISTING_URL_KEY);
  } catch (err) {
    console.error("Failed to load listing URL", err);
    return null;
  }
}

/* =========================================================
   Scan Storage Utility
========================================================= */

export type ScanType = "online" | "in-person";

export interface SavedScan {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;

  deviceId?: string;

  listingUrl?: string;
  summary?: string;

  inProgress?: boolean;
  completed?: boolean;
}

const SCAN_INDEX_KEY = "carverity_saved_scans_v2";

function normaliseScan(scan: any): SavedScan {
  return {
    ...scan,
    deviceId: scan.deviceId ?? getDeviceId(),
    inProgress: scan.inProgress ?? false,
    completed: scan.completed ?? false,
  };
}

export function loadScans(): SavedScan[] {
  try {
    const raw = localStorage.getItem(SCAN_INDEX_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normaliseScan);
  } catch {
    return [];
  }
}

export function saveScan(scan: SavedScan) {
  const existing = loadScans();
  const updated = [normaliseScan(scan), ...existing];
  localStorage.setItem(SCAN_INDEX_KEY, JSON.stringify(updated));
}

export function updateScan(scanId: string, update: Partial<SavedScan>) {
  const updated = loadScans().map((s) =>
    s.id === scanId ? { ...s, ...update } : s
  );
  localStorage.setItem(SCAN_INDEX_KEY, JSON.stringify(updated));
}

export function deleteScan(scanId: string) {
  const filtered = loadScans().filter((s) => s.id !== scanId);
  localStorage.setItem(SCAN_INDEX_KEY, JSON.stringify(filtered));
}

export function clearAllScans() {
  localStorage.removeItem(SCAN_INDEX_KEY);
}

export function generateScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
