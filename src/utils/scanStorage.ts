/* =========================================================
   Inspection Storage Utility
   Local-only persistence (in-person only)
========================================================= */

export type InspectionType = "in-person";

export interface InspectionHistoryEvent {
  at: string;
  event: string;
}

export interface SavedInspection {
  id: string;
  type: InspectionType;
  title: string;
  createdAt: string;

  // Vehicle identity (used for display + grouping)
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
  };

  // Summary metrics (used for lists / quick previews)
  askingPrice?: number | null;
  score?: number;
  concerns?: number;
  unsure?: number;
  imperfectionsCount?: number;
  photosCount?: number;
  fromOnlineScan?: boolean;

  // Timeline of user actions (save, export, follow-ups, notes)
  history?: InspectionHistoryEvent[];

  // Completion hint (future use)
  completed?: boolean;
}

const STORAGE_KEY = "carverity_saved_inspections";

/* =========================================================
   Normalisation — keeps older saved records safe
========================================================= */

function normaliseInspection(record: any): SavedInspection {
  // Back-compat: some earlier code used created_at (snake) instead of createdAt
  const createdAt =
    typeof record?.createdAt === "string"
      ? record.createdAt
      : typeof record?.created_at === "string"
      ? record.created_at
      : new Date().toISOString();

  const title =
    typeof record?.title === "string" && record.title.trim()
      ? record.title
      : "In-person inspection";

  const vehicle =
    record?.vehicle && typeof record.vehicle === "object"
      ? {
          make:
            typeof record.vehicle.make === "string"
              ? record.vehicle.make
              : undefined,
          model:
            typeof record.vehicle.model === "string"
              ? record.vehicle.model
              : undefined,
          year:
            typeof record.vehicle.year === "string"
              ? record.vehicle.year
              : undefined,
          variant:
            typeof record.vehicle.variant === "string"
              ? record.vehicle.variant
              : undefined,
        }
      : undefined;

  return {
    id: String(record?.id ?? ""),
    type: "in-person",
    title,
    createdAt,
    vehicle,

    askingPrice:
      typeof record?.askingPrice === "number" ? record.askingPrice : null,
    score: typeof record?.score === "number" ? record.score : undefined,
    concerns: typeof record?.concerns === "number" ? record.concerns : undefined,
    unsure: typeof record?.unsure === "number" ? record.unsure : undefined,
    imperfectionsCount:
      typeof record?.imperfectionsCount === "number"
        ? record.imperfectionsCount
        : undefined,
    photosCount:
      typeof record?.photosCount === "number" ? record.photosCount : undefined,
    fromOnlineScan: Boolean(record?.fromOnlineScan),

    completed: Boolean(record?.completed),
    history: Array.isArray(record?.history) ? record.history : [],
  };
}

function normaliseInspections(records: any[]): SavedInspection[] {
  return records
    .filter((r) => r && typeof r === "object")
    .map((r) => normaliseInspection(r))
    .filter((r) => r.id);
}

/* =========================================================
   Public API
========================================================= */

export function loadScans(): SavedInspection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normaliseInspections(parsed);
  } catch {
    return [];
  }
}

export function saveScan(inspection: SavedInspection) {
  const existing = loadScans().filter((i) => i.id !== inspection.id);

  const updated: SavedInspection[] = [
    normaliseInspection({
      ...inspection,
      type: "in-person",
    }),
    ...existing,
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateScanTitle(inspectionId: string, title: string) {
  const updated = loadScans().map((inspection) =>
    inspection.id === inspectionId ? { ...inspection, title } : inspection
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteScan(inspectionId: string) {
  const filtered = loadScans().filter((i) => i.id !== inspectionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllScans() {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateScanId() {
  return `inspection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
