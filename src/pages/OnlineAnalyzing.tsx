// src/pages/OnlineAnalyzing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults, loadListingUrl } from "../utils/onlineResults";

const STAGES = [
  "Reading the vehicle listing…",
  "Extracting key details…",
  "Scanning for risk signals…",
  "Preparing your AI summary…",
];

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const listingUrl = loadListingUrl();
    console.log("🔍 Analyzing listing — URL =", listingUrl);

    if (!listingUrl) {
      navigate("/scan/online", { replace: true });
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((i) => (i + 1) % STAGES.length);
    }, 2800);

    runScan(listingUrl);

    return () => clearInterval(interval);
  }, [navigate]);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: listingUrl }),
      });

      if (!res.ok) {
        console.error("❌ Scan failed", res.status);
        navigate("/scan/online", { replace: true });
        return;
      }

      const data = await res.json();
      saveOnlineResults(data);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Network error running scan", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-xl font-semibold mb-2">Analyzing your listing…</h1>

      <p className="text-muted-foreground mb-3">
        This normally takes <strong>10–30 seconds</strong>.
        Sit tight while we review pricing signals, wording and seller flags.
      </p>

      <p className="mt-2 text-sm opacity-80">{STAGES[stageIndex]}</p>

      <div className="mt-5 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-150" />
        <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse delay-300" />
      </div>
    </div>
  );
}
