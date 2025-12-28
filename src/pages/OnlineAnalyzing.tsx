// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
  type SavedResultVehicle,
} from "../utils/onlineResults";
import { loadProgress } from "../utils/scanProgress";

const LISTING_URL_KEYS = [
  "carverity_listing_url",
  "carverity_online_listing_url",
];

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = getListingUrl();

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running AI analysis for:", listingUrl);
    runScan(listingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getListingUrl(): string | null {
    for (const key of LISTING_URL_KEYS) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
    return null;
  }

  async function runScan(listingUrl: string) {
    try {
      const progress = loadProgress();

      // 🔒 Treat stored vehicle as a *partial* SavedResultVehicle
      const storedVehicle: Partial<SavedResultVehicle> =
        (progress?.vehicle as Partial<SavedResultVehicle>) ?? {};

      // 🔧 Strongly-typed vehicle object (prevents TS errors)
      const vehicle: SavedResultVehicle = {
        make: storedVehicle.make ?? "",
        model: storedVehicle.model ?? "",
        year: storedVehicle.year ?? "",
        variant: storedVehicle.variant ?? "",
        importStatus: storedVehicle.importStatus ?? "unknown",
        kilometres: storedVehicle.kilometres ?? undefined,
        owners: storedVehicle.owners ?? null,
      };

      const kilometres =
        localStorage.getItem("carverity_kilometres") ??
        (progress as any)?.kilometres ??
        null;

      const owners =
        localStorage.getItem("carverity_owners") ??
        localStorage.getItem("carverity_previous_owners") ??
        (progress as any)?.owners ??
        null;

      vehicle.kilometres = kilometres ?? undefined;
      vehicle.owners = owners ?? null;

      const conditionSummary =
        localStorage.getItem("carverity_condition") ?? null;

      const notes = localStorage.getItem("carverity_notes") ?? null;

      const payload = {
        listingUrl,
        vehicle,
        kilometres,
        owners,
        conditionSummary,
        notes,
      };

      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API responded with ${res.status}`);

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Unknown analysis error");

      const result: SavedResult = {
        createdAt: new Date().toISOString(),
        source: "online",
        sellerType: data.sellerType ?? "unknown",
        listingUrl: data.listingUrl ?? listingUrl,
        summary: data.summary ?? "",
        signals: Array.isArray(data.signals) ? data.signals : [],
        sections: Array.isArray(data.sections) ? data.sections : [],
        analysisSource: data.analysisSource ?? "ai",
        vehicle,
        conditionSummary: conditionSummary ?? undefined,
        notes: notes ?? undefined,
        isUnlocked: false,
      };

      saveOnlineResults(result);

      navigate("/scan/online/results", { replace: true });
    } catch (err: any) {
      console.error("❌ Online analysis failed:", err?.message || err);

      const fallback: SavedResult = {
        createdAt: new Date().toISOString(),
        source: "online",
        sellerType: "unknown",
        listingUrl,
        summary:
          "We couldn't run the full AI analysis right now, but you can still use this as a starting point.",
        signals: [],
        sections: [
          {
            title: "Analysis temporarily unavailable",
            content:
              "There was an issue contacting the analysis service. Please try again later.",
          },
        ],
        analysisSource: "fallback-error",
        isUnlocked: true,
      };

      saveOnlineResults(fallback);
      navigate("/scan/online/results", { replace: true });
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-4">
        Analysing your listing&hellip;
      </h1>
      <p className="text-muted-foreground mb-8">
        We’re reviewing the details you provided and preparing guidance tailored
        to this car.
      </p>

      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full w-2/3 bg-blue-500 animate-pulse" />
      </div>
    </div>
  );
}
