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

      const data: any = await res.json();

      if (!res.ok || !data?.ok) {
        console.error("❌ Scan failed:", data?.error || res.status);
        navigate("/scan/online", { replace: true });
        return;
      }

      // --------------------------
      // Robust text fallbacks
      // --------------------------
      const previewText: string =
        data.previewText ??
        data.preview ??
        data.summary ??
        data.conditionSummary ??
        "";

      const fullAnalysisText: string =
        data.fullAnalysis ??
        data.full_text ??
        data.full ??
        data.summaryLong ??
        data.summary ??
        data.conditionSummary ??
        "";

      const kilometresValue: string | number | null =
        data.kilometres ??
        data.kilometers ??
        data.km ??
        data.vehicle?.kilometres ??
        null;

      const confidenceAssessment: string =
        data.confidenceAssessment ??
        data.confidenceSummary ??
        (data.confidenceCode === "HIGH"
          ? "High — looks solid overall"
          : data.confidenceCode === "MODERATE"
          ? "Moderate — a few things to confirm"
          : data.confidenceCode === "LOW"
          ? "Low — listing confidence"
          : "");

      const stored: SavedResult = {
        type: "online",
        step: "/scan/online/results",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data.vehicle ?? {},

        sections: data.sections ?? [],
        photos: data.photos ?? { listing: [], meta: [] },

        // Preview + full content
        preview: previewText,
        previewText,
        fullAnalysis: fullAnalysisText,

        summary: data.summary ?? previewText ?? "",
        conditionSummary: data.conditionSummary ?? "",
        notes: data.notes ?? "",

        kilometres: kilometresValue,
        isUnlocked: false,

        confidenceCode: data.confidenceCode ?? null,
        confidenceSummary: data.confidenceSummary ?? "",
        confidenceAssessment,
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
