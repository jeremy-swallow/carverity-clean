// src/pages/OnlineAnalyzing.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

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
        // 🚧 TEMP FIX — API endpoint is not deployed yet
        // Instead of calling /api/analyze-listing (which 404s),
        // we simulate a response so the flow continues.

        await new Promise((r) => setTimeout(r, 1500));

        const mockAnalysis = {
          sections: [
            {
              title: "Listing tone",
              content: "No obvious scam signals detected in wording.",
            },
            {
              title: "Pricing signals",
              content: "Price appears consistent with similar vehicles.",
            },
            {
              title: "Risk indicators",
              content: "No major red flags identified.",
            },
          ],
        };

        saveProgress({
          ...progress,
          analysis: mockAnalysis,
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
