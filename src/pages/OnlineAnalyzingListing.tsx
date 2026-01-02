// src/pages/OnlineAnalyzingListing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();

  useEffect(() => {
    runScan();
  }, []);

  async function runScan() {
    const listingUrl = localStorage.getItem("carverity_online_listing_url");

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/scan/online", { replace: true });
      return;
    }

    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("❌ Scan failed:", data.error || res.status);
        navigate("/scan/online", { replace: true });
        return;
      }

      const stored: SavedResult = {
        type: "online",
        step: "/scan/online/results",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data.vehicle ?? {},

        sections: data.sections ?? [],
        photos: data.photos ?? { listing: [], meta: [] },

        // Preview + full content
        preview: data.previewText ?? data.summary ?? "",
        previewText: data.previewText ?? data.summary ?? "",
        fullAnalysis: data.fullAnalysis ?? data.summary ?? "",

        summary: data.summary ?? "",
        conditionSummary: data.conditionSummary ?? data.summary ?? "",
        notes: data.notes ?? "",

        kilometres: data.kilometres ?? null,
        isUnlocked: false,

        confidenceCode: data.confidenceCode ?? null,
        confidenceSummary: data.confidenceSummary ?? "",
      };

      saveOnlineResults(stored);
      navigate("/scan/online/results", { replace: true });

    } catch (err) {
      console.error("❌ Scan crash:", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Please wait while we review the vehicle details.
      </p>
    </div>
  );
}
