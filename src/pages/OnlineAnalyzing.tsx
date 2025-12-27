// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL in storage — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running scan for:", listingUrl);
    runScan(listingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();

      const normalized: SavedResult = {
        createdAt: new Date().toISOString(),
        source: "online", // valid union value
        sellerType: data.sellerType ?? "dealer",
        listingUrl,
        signals: Array.isArray(data.signals) ? data.signals : [],
        sections: Array.isArray(data.sections) ? data.sections : [],
        analysisSource: data.analysisSource ?? "live",
      };

      saveOnlineResults(normalized);
      console.log("💾 Saved analysis →", normalized);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Scan failed — saving fallback result", err);

      const fallback: SavedResult = {
        createdAt: new Date().toISOString(),
        source: "online",
        sellerType: "unknown",
        listingUrl,
        signals: [],
        sections: [],
        analysisSource: "fallback",
      };

      saveOnlineResults(fallback);
      navigate("/scan/online/results", { replace: true });
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <p className="text-lg text-muted-foreground">
        Scanning listing…
      </p>
    </div>
  );
}
