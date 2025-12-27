import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const location = useLocation();

  const listingUrl = (location.state as any)?.listingUrl ?? "";

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      try {
        console.log("➡️ Calling /api/analyze-listing");

        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        const json = await res.json();
        console.log("🟢 API response:", json);

        if (!json?.ok) {
          throw new Error("Invalid API response");
        }

        // ---- SAFE NORMALIZED RESULT ----
        const stored = {
          createdAt: new Date().toISOString(),
          source: json.analysisSource ?? "live",
          sellerType: json.sellerType ?? "unknown",
          listingUrl,
          signals: Array.isArray(json.signals) ? json.signals : [],
          sections: Array.isArray(json.sections) ? json.sections : [],
        };

        console.log("💾 Saving result:", stored);
        saveOnlineResults(stored);

      } catch (err) {
        console.error("❌ API failed — saving fallback", err);

        // Fallback only when real API fails
        saveOnlineResults({
          createdAt: new Date().toISOString(),
          source: "offline-fallback",
          sellerType: "unknown",
          listingUrl,
          signals: [],
          sections: [],
        });
      }

      if (!cancelled) {
        navigate("/scan/online/results", { replace: true });
      }
    }

    runAnalysis();
    return () => { cancelled = true; };

  }, [listingUrl, navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        Please wait while we process the listing.
      </p>
    </div>
  );
}
