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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!res.ok || !data?.ok) {
        console.error("❌ Online scan failed:", data?.error || res.status);
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

        // 🔐 New split: short preview vs full analysis
        previewSummary:
          data.previewSummary ??
          data.previewText ??
          data.summary ??
          "",
        previewText:
          data.previewText ??
          data.previewSummary ??
          data.summary ??
          "",
        // Important: do NOT fall back to summary here,
        // otherwise the full panel just repeats the preview.
        fullAnalysis: data.fullAnalysis ?? "",

        summary: data.summary ?? "",
        conditionSummary: data.conditionSummary ?? "",
        notes: data.notes ?? "",

        kilometres: data.kilometres ?? null,
        isUnlocked: false,

        confidenceCode: data.confidenceCode ?? null,
        confidenceSummary: data.confidenceSummary ?? "",
        confidenceAssessment: data.confidenceAssessment ?? "",
      };

      saveOnlineResults(stored);
      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Online scan crash:", err);
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
