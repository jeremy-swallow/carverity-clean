// src/pages/OnlineAnalyzingListing.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
  loadListingUrl,
} from "../utils/onlineResults";

const STAGES = [
  "Reading the vehicle listing…",
  "Extracting key details…",
  "Scanning for risk signals…",
  "Preparing your AI summary…",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const listingUrl = loadListingUrl();

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/scan/online", { replace: true });
      return;
    }

    const stageTimer = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 3500);

    runScan(listingUrl);

    return () => clearInterval(stageTimer);
  }, [navigate]);

  async function runScan(listingUrl: string) {
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
        previewText: data.previewText ?? data.summary ?? "",
        fullAnalysis: data.fullAnalysis ?? data.summary ?? "",

        summary: data.summary ?? "",
        conditionSummary: data.conditionSummary ?? data.summary ?? "",
        notes: data.notes ?? "",

        kilometres: data.kilometres ?? null,
        isUnlocked: false,

        confidenceCode: data.confidenceCode ?? null,
        confidenceSummary:
          data.confidenceSummary ??
          (data.confidenceCode === "HIGH"
            ? "High — looks solid overall"
            : data.confidenceCode === "LOW"
            ? "Low — proceed with caution"
            : "Moderate — a few things to confirm"),

        source: data.source ?? "gemini-2.5-flash",
        analysisSource: data.source ?? "gemini-2.5-flash",
      };

      saveOnlineResults(stored);
      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Unexpected scan error", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-xl font-semibold mb-2">Analyzing your listing…</h1>

      <p className="text-muted-foreground mb-2">
        This normally takes <strong>10–30 seconds</strong>.
        <br />
        Thanks for your patience — your report is being generated.
      </p>

      <p className="mt-4 text-sm opacity-80">{STAGES[stageIndex]}</p>

      <div className="mt-6 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-150" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-300" />
      </div>

      <p className="mt-6 text-xs opacity-60">
        If this takes longer than 45 seconds, your internet connection may be
        slow.
      </p>
    </div>
  );
}
