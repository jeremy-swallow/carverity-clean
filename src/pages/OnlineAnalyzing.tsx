import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      const listingUrl = (location.state as any)?.listingUrl ?? "";

      if (!listingUrl) {
        console.warn("No listing URL — aborting scan");
        navigate("/scan/online");
        return;
      }

      console.log("🟡 Sending scan request →", listingUrl);

      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        });

        const data = await res.json();
        console.log("🟢 API response:", data);

        const normalized: SavedResult = {
          createdAt: new Date().toISOString(),
          source: "online",
          sellerType: data.sellerType ?? "unknown",
          listingUrl,
          signals: Array.isArray(data.signals) ? data.signals : [],
          sections: Array.isArray(data.sections) ? data.sections : [],
          analysisSource: data.analysisSource ?? "live",
        };

        // Save the normalized result so OnlineResults can read it
        saveOnlineResults(normalized);

        // Go to the results page
        navigate("/scan/online/results", { replace: true });
      } catch (err) {
        console.error("❌ API failed — using fallback result", err);

        const fallback: SavedResult = {
          createdAt: new Date().toISOString(),
          source: "online", // must match union type
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

    run();
  }, [location, navigate]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Please wait while we process the listing.
      </p>
    </main>
  );
}
