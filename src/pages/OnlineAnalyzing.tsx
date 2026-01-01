// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  loadOnlineResults,
} from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running scan for:", listingUrl);
    runScan(listingUrl);
  }, [navigate]);

  async function runScan(listingUrl: string) {
    try {
      // 🔹 Fresh baseline so we never show stale results
      const fresh: SavedResult = {
        type: "online",
        step: "/online/analyzing",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: {},

        sections: [],
        signals: [],

        photos: {
          listing: [],
          meta: [],
        },

        isUnlocked: false,

        source: "listing",
        analysisSource: "auto-search+extractor",
        sellerType: "",

        conditionSummary: "",
        summary: "",

        kilometres: null,
        owners: "",
        notes: "",
      };

      saveOnlineResults(fresh);

      // 🔹 Call analysis API
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      if (!res.ok) {
        console.error("❌ API returned non-ok response", res.status);
        alert("Scan failed — the listing could not be analysed.");
        navigate("/start-scan", { replace: true });
        return;
      }

      const data = await res.json();
      console.log("✅ ANALYSIS RESULT", data);

      const stored = loadOnlineResults() ?? fresh;

      // 🔹 Normalise kilometres to string | number | null
      let kilometresValue: string | number | null = null;
      if (
        typeof data.kilometres === "string" ||
        typeof data.kilometres === "number"
      ) {
        kilometresValue = data.kilometres;
      } else if (
        typeof stored.kilometres === "string" ||
        typeof stored.kilometres === "number"
      ) {
        kilometresValue = stored.kilometres;
      } else {
        kilometresValue = null;
      }

      const updated: SavedResult = {
        ...stored,

        // 🔒 keep literal type
        type: "online",

        // move to next step in the flow
        step: "/online/vehicle-details",

        createdAt: stored.createdAt ?? new Date().toISOString(),
        listingUrl,

        vehicle: data.vehicle ?? stored.vehicle ?? {},

        sections: data.sections ?? stored.sections ?? [],
        signals: data.signals ?? stored.signals ?? [],

        photos: stored.photos ?? { listing: [], meta: [] },

        isUnlocked: stored.isUnlocked ?? false,

        source: "listing",
        analysisSource: "auto-search+extractor",
        sellerType: data.sellerType ?? stored.sellerType ?? "",

        conditionSummary:
          data.conditionSummary ?? stored.conditionSummary ?? "",
        summary: data.summary ?? stored.summary ?? "",

        kilometres: kilometresValue,
        owners: data.owners ?? stored.owners ?? "",
        notes: stored.notes ?? "",
      };

      saveOnlineResults(updated);
      console.log("💾 Saved scan state >>>", updated);

      // ✅ Go to vehicle details step for manual confirmation
      navigate("/online/vehicle-details", { replace: true });
    } catch (err) {
      console.error("❌ Analysis failed:", err);
      alert("Scan failed — please try again.");
      navigate("/start-scan", { replace: true });
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Analyzing listing...</h1>
      <p className="text-muted-foreground">
        This may take a few seconds. We&apos;re pulling out key vehicle details
        and early risk signals from the listing.
      </p>
    </div>
  );
}
