/* =========================================================
   Vehicle Details — Persistent storage (v1, upgrade-safe)
   ========================================================= */

export interface VehicleDetails {
  make?: string;
  model?: string;
  year?: string;
  variant?: string;
  isImport?: boolean;
}

const STORAGE_KEY = "carverity_vehicle_details";

/** Save / merge details safely */
export function saveVehicleDetails(update: Partial<VehicleDetails>) {
  const existing = loadVehicleDetails() ?? {};
  const merged = { ...existing, ...update };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/** Load stored details (or null) */
export function loadVehicleDetails(): VehicleDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VehicleDetails) : null;
  } catch {
    return null;
  }
}

/** Clear saved details */
export function clearVehicleDetails() {
  localStorage.removeItem(STORAGE_KEY);
}
