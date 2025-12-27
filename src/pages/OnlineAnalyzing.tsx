import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

interface NormalizedResult {
  createdAt: string;
  source: "online" | "in-person";
  sellerType: string;
  listingUrl: string;
  signals: any[];
  sections: any[];
  analysisSource?: string;
}

export default function OnlineAnalyzing() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = (location.state as any)?.listingUrl;

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("▶️ Running analysis for", listingUrl);

    (async () => {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        const json = await res.json();
        console.log("API Response:", json);

        const normalized: NormalizedResult = {
          createdAt: new Date().toISOString(),
          source: "online",
          sellerType: json.sellerType ?? "unknown",
          listingUrl,
          signals: Array.isArray(json.signals) ? json.signals : [],
          sections: Array.isArray(json.sections) ? json.sections : [],
          analysisSource: json.analysisSource ?? "live",
        };

        saveOnlineResults(normalized);
        navigate("/scan/online/results", { replace: true });

      } catch (err) {
        console.error("❌ API failed — using fallback", err);

        const fallback: NormalizedResult = {
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
    })();
  }, [location.state, navigate]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Please wait while we scan the listing.
      </p>
    </main>
  );
}
