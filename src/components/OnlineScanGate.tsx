import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineScanGate() {
  const navigate = useNavigate();

  useEffect(() => {
    const progress = loadOnlineResults();

    // If user somehow landed here without a scan session
    if (!progress || progress.type !== "online") {
      console.warn("⚠️ No active scan — redirecting to start");
      navigate("/start-scan", { replace: true });
      return;
    }

    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    // If no URL — fallback to manual entry mode
    if (!listingUrl) {
      console.log("No listing URL — entering manual mode");
      handleManualEntry();
      return;
    }

    runListingAnalysis(listingUrl);
  }, []);

  async function runListingAnalysis(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl }),
      });

      const data = await res.json();
      console.log("ANALYSIS RESULT >>>", data);

      if (!data.ok) {
        alert("Scan failed — please try again.");
        return;
      }

      const result: SavedResult = {
        type: "online",
        step: "/online/vehicle-details",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: data.vehicle ?? {},

        sections: Array.isArray(data.sections) ? data.sections : [],
        signals: Array.isArray(data.signals) ? data.signals : [],

        photos: {
          listing: data.photos ?? [],
          meta: data.photoMeta ?? [],
        },

        conditionSummary: data.conditionSummary ?? "",
        summary: data.summary ?? "",

        sellerType: data.sellerType ?? "unknown",
        source: data.source ?? "vehicle-extractor",

        kilometres: data.kilometres ?? undefined,
        owners: data.owners ?? undefined,
        notes: data.notes ?? undefined,

        isUnlocked: true, // allow full report at this stage
      };

      saveOnlineResults(result);
      navigate("/online/vehicle-details", { replace: true });

    } catch (err) {
      console.error("❌ analyze-listing error", err);
      alert("Scan failed — please try again.");
    }
  }

  function handleManualEntry() {
    const result: SavedResult = {
      type: "online",
      step: "/online/vehicle-details",
      createdAt: new Date().toISOString(),

      listingUrl: null,
      vehicle: {},

      sections: [],
      signals: [],

      photos: { listing: [], meta: [] },

      conditionSummary: "",
      summary: "",

      sellerType: "unknown",
      source: "manual-entry",

      kilometres: undefined,
      owners: undefined,
      notes: undefined,

      isUnlocked: true,
    };

    saveOnlineResults(result);
    navigate("/online/vehicle-details", { replace: true });
  }

  return null;
}
