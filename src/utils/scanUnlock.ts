const STORAGE_KEY = "carverity_scan_unlocks_v1";

type UnlockMap = Record<string, true>;

function loadAll(): UnlockMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: UnlockMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function isScanUnlocked(scanId: string | null | undefined): boolean {
  if (!scanId) return false;
  const map = loadAll();
  return Boolean(map[scanId]);
}

export function unlockScan(scanId: string) {
  const map = loadAll();
  map[scanId] = true;
  saveAll(map);
}
