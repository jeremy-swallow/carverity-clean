/* =========================================================
   Scan Credits — Local persistence (v1, upgrade-safe)
   ========================================================= */

const STORAGE_KEY = "carverity_scan_credits";

/** Load current balance (never below zero) */
export function loadCredits(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/** Save credits (clamped to >= 0) */
export function saveCredits(value: number) {
  const safe = Math.max(0, Math.floor(value));
  localStorage.setItem(STORAGE_KEY, String(safe));

  // Notify other tabs + listeners
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: String(safe),
    })
  );
}

/** Add credits (used when purchasing) */
export function addCredits(amount: number) {
  const next = loadCredits() + Math.max(0, amount);
  saveCredits(next);
  return next;
}

/** Attempt to use one credit (atomic, never below zero) */
export function useOneCredit(): { ok: true; remaining: number } | { ok: false; remaining: number } {
  const current = loadCredits();

  if (current <= 0) {
    return { ok: false, remaining: 0 };
  }

  const next = current - 1;
  saveCredits(next);

  return { ok: true, remaining: next };
}
