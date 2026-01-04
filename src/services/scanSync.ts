// src/services/scanSync.ts
import { supabase } from "../supabaseClient";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { getCurrentUser } from "../supabaseAuth";

export type CloudScanRecord = {
  id?: string;
  user_id?: string | null;
  scan_id: string;          // local scan id
  scan_type: "online" | "in-person";
  plan?: string | null;
  report: any;              // JSONB in Supabase
  created_at?: string;
  updated_at?: string;
};

/* =========================================================
   Save scan to Supabase (and keep local copy)
========================================================= */

export async function syncScanToCloud(result: SavedResult): Promise<void> {
  try {
    const user = await getCurrentUser();

    const payload: CloudScanRecord = {
      user_id: user?.id ?? null,
      scan_id: result.step || result.createdAt,
      scan_type: "online",
      plan: "free",
      report: {
        vehicle: result.vehicle,
        confidenceCode: result.confidenceCode,
        previewSummary: result.previewSummary,
        fullSummary: result.fullSummary,
        summary: result.summary,
        sections: result.sections,
        createdAt: result.createdAt,
        listingUrl: result.listingUrl,
        source: result.source ?? result.analysisSource ?? "local",
      },
    };

    const { error } = await supabase.from("scans").upsert(payload, {
      onConflict: "scan_id",
    });

    if (error) {
      console.warn("⚠️ Cloud sync failed — keeping local only", error.message);
      return;
    }

    console.log("☁️ Scan synced to Supabase");

    // Ensure local storage remains in sync
    saveOnlineResults(result);
  } catch (err: any) {
    console.error("❌ syncScanToCloud exception:", err?.message || err);
  }
}

/* =========================================================
   Load scans from cloud for signed-in user
========================================================= */

export async function loadCloudScans(): Promise<SavedResult[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("scans")
    .select("scan_id, report")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadCloudScans error:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    ...(row.report || {}),
    type: "online",
    step: row.scan_id,
    isUnlocked: Boolean(row?.report?.fullSummary),
    photos: { listing: [] },
    sections: row?.report?.sections ?? [],
  })) as SavedResult[];
}

/* =========================================================
   Attach local scans to user after login
========================================================= */

export async function migrateLocalScanToAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const local = loadOnlineResults();
  if (!local) return;

  console.log("🔗 Linking local scan to account…");
  await syncScanToCloud(local);
}
