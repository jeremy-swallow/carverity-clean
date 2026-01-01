// src/pages/OnlineAnalyzingListing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    runScan(listingUrl);
  }, []);

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

      // 🟢 Normalise + persist result BEFORE navigation
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
        isUnlocked: true,
        source: data.source ?? "gemini",
      };

      saveOnlineResults(stored);

      // 🚀 Go to results page (guaranteed to have data now)
      navigate("/online/results", { replace: true });

    } catch (err) {
      console.error("❌ Unexpected scan error", err);
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        This usually takes 10–30 seconds.<br />
        Fetching the listing details…
      </p>

      <div className="mt-6 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-150" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-300" />
      </div>
    </div>
  );
}
