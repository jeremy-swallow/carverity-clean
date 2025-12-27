// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      const state = location.state as { listingUrl?: string } | null;
      const fromState = state?.listingUrl?.trim();
      const fromStorage = localStorage.getItem(LISTING_URL_KEY)?.trim();

      const listingUrl = fromState || fromStorage || "";

      if (!listingUrl) {
        console.warn("⚠️ No listing URL — aborting scan");
        navigate("/start-scan", { replace: true });
        return;
      }

      // Make sure it’s in storage for later steps
      localStorage.setItem(LISTING_URL_KEY, listingUrl);

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
          source: "online",
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
    };

    void run();
  }, [location, navigate]);

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <p className="text-lg text-muted-foreground">
        Scanning listing…
      </p>
    </div>
  );
}
