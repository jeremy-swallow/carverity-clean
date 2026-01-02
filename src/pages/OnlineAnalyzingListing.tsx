// src/pages/OnlineAnalyzingListing.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

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
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    // 🌀 Rotate visible progress messages every few seconds
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
        body: JSON.stringify({ listingUrl }),
      });

      const data = await res.json();

      if (!data.ok) {
        console.error("❌ Scan failed:", data.error);
        navigate("/start-scan", { replace: true });
        return;
      }

      const stored: SavedResult = {
        type: "online",
        step: "/online/results",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data.vehicle ?? {},

        sections: data.sections ?? [],
        photos: data.photos ?? { listing: [], meta: [] },

        summary: data.summary ?? "",
        conditionSummary: data.summary ?? "",

        kilometres: data.kilometres ?? null,
        isUnlocked: false, // start in preview / locked state

        source: data.source ?? "gemini-2.5-flash",
        analysisSource: data.source ?? "gemini-2.5-flash",

        confidenceCode: data.confidenceCode ?? null,
      };

      saveOnlineResults(stored);

      navigate("/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Unexpected scan error", err);
      navigate("/start-scan", { replace: true });
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
        If this takes longer than 45 seconds, your internet connection may be slow.
      </p>
    </div>
  );
}
