/* api/scanProgress.ts */
export type ScanProgress = {
  type?: 'online' | 'in-person';
  step?: string;
  listingUrl?: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
    importStatus?: string;
  };
  startedAt?: string;
};

/**
 * In-memory store
 * (Vercel may clear this between requests — that’s OK for MVP)
 */
let SCAN_STATE: Partial<ScanProgress> = {};

export function loadProgress(): Partial<ScanProgress> {
  return SCAN_STATE;
}

export function saveProgress(update: Partial<ScanProgress>) {
  SCAN_STATE = { ...SCAN_STATE, ...update };
  return SCAN_STATE;
}
