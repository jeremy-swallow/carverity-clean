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

  // Timeline of user actions (save, export, follow-ups, notes)
  history?: InspectionHistoryEvent[];

  // Completion hint (future use)
  completed?: boolean;
}

const STORAGE_KEY = "carverity_saved_inspections";

/* =========================================================
   Normalisation — keeps older saved records safe
========================================================= */

function normaliseInspections(records: any[]): SavedInspection[] {
  return records.map((record) => ({
    ...record,
    type: "in-person",
    completed: record.completed ?? false,
    history: record.history ?? [],
  })) as SavedInspection[];
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
    {
      ...inspection,
      type: "in-person",
      completed: inspection.completed ?? false,
      history: inspection.history ?? [],
    },
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
  return `inspection_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
