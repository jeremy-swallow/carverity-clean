import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      console.log("🔹 OnlineAnalyzing mounted");

      const progress = loadProgress();
      console.log("🔹 Loaded progress:", progress);

      const listingUrl = progress?.listingUrl;
      if (!listingUrl) {
        console.warn("⚠️ No listingUrl found — redirecting to /scan/online");
        navigate("/scan/online");
        return;
      }

      try {
        console.log("🚀 Sending request to API:", {
          endpoint: "/api/analyze-listing",
          body: { listingUrl }
        });

        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl }),
        });

        console.log("📡 Response status:", res.status);

        const json = await res.json();
        console.log("📬 API JSON:", json);

        saveProgress({
          ...progress,
          analysis: json?.analysis ?? null,
        });

        console.log("✅ Saved analysis — navigating to results");
        navigate("/scan/online/results");
      } catch (err) {
        console.error("❌ Analyze request failed:", err);
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
