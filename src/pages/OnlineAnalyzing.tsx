import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let listingUrl = "";

    // 1) Try to read from React Router state
    const state = location.state as any | null;

    if (state) {
      listingUrl =
        state.listingUrl ??
        state.url ??
        state.listingURL ??
        state.link ??
        "";
    }

    // 2) If that failed, try sessionStorage backup
    if (!listingUrl && typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem(LISTING_URL_KEY);
        if (stored) {
          listingUrl = stored;
        }
      } catch (err) {
        console.error("Failed to read listing URL from sessionStorage:", err);
      }
    }

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan. state was:", location.state);
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🔎 Running scan on:", listingUrl);

    // For now: save a basic result object so the results page has something to render
    saveOnlineResults({
      createdAt: new Date().toISOString(),
      source: "online",
      sellerType: "unknown",
      listingUrl,
      signals: [],
      sections: [],
      analysisSource: "live",
    });

    navigate("/scan/online/results", { replace: true });
  }, [location.state, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <p className="text-sm text-white/70">Analyzing listing…</p>
        <p className="text-xs text-white/40">
          This should only take a moment.
        </p>
      </div>
    </main>
  );
}
