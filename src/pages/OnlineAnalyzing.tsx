// src/pages/OnlineAnalyzing.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { saveOnlineResults } from "../utils/onlineResults";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const progress = loadProgress();
      const listingUrl = progress?.listingUrl;

      if (!listingUrl) {
        navigate("/scan/online/start");
        return;
      }

      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        const json = await res.json();

        // Save structured results for Results page
        saveOnlineResults({
          createdAt: new Date().toISOString(),
          source: "online",
          sections: json?.sections ?? [],
        });

        // Also keep in progress store
        saveProgress({
          ...progress,
          analysis: json ?? null,
        });

        navigate("/scan/online/results");
      } catch {
        navigate("/scan/online/results");
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold mb-4">Analyzing listing…</h1>
      <p className="text-muted-foreground">
        We’re reviewing wording tone, pricing signals, trust indicators, and risk flags.
      </p>
    </div>
  );
}
