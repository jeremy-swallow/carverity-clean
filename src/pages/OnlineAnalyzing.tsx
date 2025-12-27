// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";
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
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl }), // ✅ API expects listingUrl
      });

      if (!res.ok) {
        // Surface the API failure so we drop into the catch block
        const text = await res.text().catch(() => "");
        throw new Error(`API returned ${res.status} ${res.statusText}: ${text}`);
      }

      const data = await res.json();

      const normalized: SavedResult = {
        createdAt: new Date().toISOString(),
        source: "online",
        sellerType: data.sellerType ?? "unknown",
        listingUrl,
        signals: Array.isArray(data.signals) ? data.signals : [],
        sections: Array.isArray(data.sections) ? data.sections : [],
        analysisSource: data.analysisSource ?? "ai",
      };

      saveOnlineResults(normalized);
      console.log("💾 Saved analysis →", normalized);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Scan failed — saving fallback", err);

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
      <p>Scanning listing…</p>
    </div>
  );
}
