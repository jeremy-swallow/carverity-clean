// src/utils/scanCredits.ts
/* =========================================================
   Scan Credits (Deprecated)
   =========================================================
   IMPORTANT:
   CarVerity credits are now stored server-side in Supabase:
   - public.profiles.credits
   - public.credit_ledger

   This file is intentionally kept to avoid breaking older imports,
   but it must NOT be used for real credit logic.

   Any code still importing scanCredits.ts should be migrated to
   reading credits from Supabase (profiles) instead.
========================================================= */

export function loadCredits(): number {
  // Deprecated local storage credits are disabled.
  return 0;
}

export function saveCredits(_value: number) {
  // No-op (deprecated)
}

export function addCredits(_amount: number) {
  // No-op (deprecated)
  return 0;
}

export function useOneCredit():
  | { ok: true; remaining: number }
  | { ok: false; remaining: number } {
  // Deprecated local storage credits are disabled.
  return { ok: false, remaining: 0 };
}
