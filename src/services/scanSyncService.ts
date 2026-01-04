// src/services/scanSyncService.ts
//
// Cloud ↔ local scan sync for CarVerity
// - Works with BOTH online + in-person scans
// - Uses Supabase `scans` table with RLS
// - Safe to call even if user is not logged in (no-op)

import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../supabaseAuth";
import {
  type SavedScan,
  type ScanType,
  loadScans,
  saveScan,
} from "../utils/onlineResults";

// Name of the Supabase table we’re syncing with
const SCANS_TABLE = "scans";

export type CloudScanRecord = {
  scan_id: string;
  scan_type: ScanType;
  plan: string | null;
  report: any | null;
  created_at?: string | null;
};

/* =========================================================
   Core helpers
========================================================= */

/**
 * Push a single scan to Supabase for the current user.
 * - Safe to call many times: upsert on scan_id.
 * - Does nothing if the user is not logged in.
 */
export async function syncScanToCloud(
  scan: SavedScan,
  options?: {
    plan?: string | null;     // "free" | "paid" | etc
    report?: any | null;      // full report payload (online result, in-person notes, etc.)
  }
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    // Not signed in — keep everything local-only
    return;
  }

  const payload: CloudScanRecord = {
    scan_id: scan.id,
    scan_type: scan.type,
    plan: options?.plan ?? null,
    report: options?.report ?? null,
  };

  const { error } = await supabase
    .from(SCANS_TABLE)
    .upsert(
      {
        user_id: user.id,
        ...payload,
      },
      { onConflict: "scan_id" }
    );

  if (error) {
    console.error("syncScanToCloud error:", error.message);
    // We do NOT throw here — local save has already happened.
  }
}

/**
 * Fetch all scans for the current user from Supabase.
 * Returns [] if not logged in or any error occurs.
 */
export async function fetchUserScansFromCloud(): Promise<CloudScanRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(SCANS_TABLE)
    .select("scan_id, scan_type, plan, report, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchUserScansFromCloud error:", error.message);
    return [];
  }

  return (data as CloudScanRecord[]) ?? [];
}

/* =========================================================
   Merge cloud → local
========================================================= */

/**
 * Merge Supabase scans into local storage.
 *
 * Behaviour:
 * - Keeps existing local scans.
 * - Adds any cloud scans that don’t exist locally yet.
 * - If the same scan_id exists in both, the local copy wins
 *   (so the device you’re using feels “authoritative”).
 */
export async function mergeCloudScansIntoLocal(): Promise<void> {
  const cloudScans = await fetchUserScansFromCloud();
  if (!cloudScans.length) return;

  const localScans = loadScans();
  const localById = new Map(localScans.map((s) => [s.id, s]));

  for (const cloud of cloudScans) {
    if (!localById.has(cloud.scan_id)) {
      // Create a minimal SavedScan stub from the cloud record.
      const stub: SavedScan = {
        id: cloud.scan_id,
        type: cloud.scan_type,
        title: buildTitleFromReport(cloud),
        createdAt: cloud.created_at || new Date().toISOString(),
        listingUrl: (cloud.report && cloud.report.listingUrl) || undefined,
        summary:
          (cloud.report && cloud.report.conditionSummary) ||
          (cloud.report && cloud.report.summary) ||
          undefined,
        completed: true,
      };

      // This uses your existing local save logic
      saveScan(stub);
      localById.set(stub.id, stub);
    }
  }
}

/**
 * Very small helper to build a user-friendly title when we
 * reconstruct scans from cloud records.
 */
function buildTitleFromReport(cloud: CloudScanRecord): string {
  const r = (cloud.report || {}) as any;

  // Try vehicle info first (online scan)
  const vehicle = r.vehicle || {};
  const year = vehicle.year || "";
  const make = vehicle.make || "";
  const model = vehicle.model || "";

  if (year || make || model) {
    return [year, make, model].filter(Boolean).join(" ");
  }

  // Fallback to any generic title we may have stored
  if (typeof r.title === "string" && r.title.trim()) {
    return r.title.trim();
  }

  // Final generic fallback
  return cloud.scan_type === "online"
    ? "Online scan"
    : "In-person scan";
}
