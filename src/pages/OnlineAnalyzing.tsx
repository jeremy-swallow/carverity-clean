// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults, type SavedResult } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    async function runScan(listingUrl: string) {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        const data = await res.json();

        const result: SavedResult = {
          type: "online",
          step: "/scan/online/results",
          createdAt: new Date().toISOString(),

          listingUrl,
          vehicle: data.vehicle ?? {},

          sections: Array.isArray(data.sections) ? data.sections : [],
          signals: Array.isArray(data.signals) ? data.signals : [],

          photos: {
            listing: data.photos ?? [],
            meta: data.photoMeta ?? [],
          },

          conditionSummary: data.summary ?? "",
          summary: data.summary ?? "",

          kilometres: data.kilometres ?? undefined,
          owners: data.owners ?? undefined,
          notes: data.notes ?? undefined,

          sellerType: data.sellerType ?? "unknown",
          source: "ai",

          isUnlocked: false,
        };

        saveOnlineResults(result);
        navigate("/scan/online/results", { replace: true });
      } catch (err) {
        console.error("Scan failed:", err);
        alert("Scan failed — please try again.");
      }
    }

    const url = localStorage.getItem("carverity_online_listing_url");
    if (url) runScan(url);
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto py-16 px-6 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">This may take a few seconds.</p>
    </div>
  );
}
