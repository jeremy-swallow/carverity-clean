// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

/**
 * Create a short hash for each uploaded image
 */
async function hashImage(base64: string): Promise<string> {
  const data = await fetch(base64).then((r) => r.arrayBuffer());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const progress = loadProgress();
    const listingUrl =
      localStorage.getItem("carverity_listing_url") ?? "";

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    runScan(listingUrl, progress).catch((err) => {
      console.error("❌ Scan failed:", err);
      navigate("/scan/online/results", { replace: true });
    });
  }, [navigate]);

  async function runScan(listingUrl: string, progress: any) {
    const vehicle = {
      make: progress?.vehicle?.make ?? "",
      model: progress?.vehicle?.model ?? "",
      year: progress?.vehicle?.year ?? "",
      variant: progress?.vehicle?.variant ?? "",
      importStatus: progress?.vehicle?.importStatus ?? "unknown",
    };

    const kilometres =
      localStorage.getItem("carverity_kilometres") ??
      progress?.kilometres ??
      null;

    const owners =
      localStorage.getItem("carverity_owners") ??
      progress?.owners ??
      null;

    const conditionSummary = progress?.conditionSummary ?? "";
    const notes = progress?.notes ?? "";

    const listingPhotos: string[] = progress?.photos?.listing ?? [];

    // Build image metadata
    const photoMeta = await Promise.all(
      listingPhotos.map(async (p, i) => ({
        index: i,
        hash: await hashImage(p),
        approxSizeKB: Math.round((p.length * (3 / 4)) / 1024),
      }))
    );

    let data: any = {};

    try {
      const aiResponse = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingUrl,
          vehicle,
          kilometres,
          owners,
          conditionSummary,
          notes,
          photos: {
            count: listingPhotos.length,
            hashes: photoMeta,
          },
        }),
      });

      data = await aiResponse.json();
    } catch {
      console.warn("⚠️ AI request failed — fallback mode");
    }

    const result: SavedResult = {
      createdAt: new Date().toISOString(),
      source: "online",
      listingUrl,
      analysisSource: data.analysisSource ?? "ai",

      vehicle,
      kilometres: kilometres ?? undefined,
      owners,
      conditionSummary,
      notes,

      photos: {
        listing: listingPhotos,
        meta: photoMeta,
      },

      signals: Array.isArray(data.signals) ? data.signals : [],
      sections: Array.isArray(data.sections) ? data.sections : [],

      summary: data.summary ?? "",
      sellerType: data.sellerType ?? "unknown",

      isUnlocked: false,
    };

    saveOnlineResults(result);
    navigate("/scan/online/results", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">
        Analysing listing…
      </h1>
      <p className="text-muted-foreground">
        We’re reviewing the listing and attached details.
      </p>
    </div>
  );
}
