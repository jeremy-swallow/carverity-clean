/* =========================================================
   Online Analyzing (Manual-Input Mode — scraping disabled)
   ========================================================= */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_listing_url";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    // If somehow we got here without a link, send user back to start
    if (!listingUrl) {
      console.warn("No listing URL — returning to start");
      navigate("/scan/online", { replace: true });
      return;
    }

    // ❗ Manual mode — DO NOT auto-scrape
    // We just create a placeholder saved record for now

    const placeholder = {
      createdAt: new Date().toISOString(),
      source: "online" as const,
      sellerType: "unknown",
      listingUrl,
      signals: [],
      sections: [],
      analysisSource: "manual-input",
      isUnlocked: false,
    };

    saveOnlineResults(placeholder);

    // Continue to results normally
    navigate("/scan/online/results", { replace: true });
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto py-24 text-center">
      <p>Preparing your manual scan…</p>
    </div>
  );
}
