// src/pages/OnlineAnalyzingListing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const STEPS = [
  "Reading listing content…",
  "Checking vehicle details…",
  "Reviewing photo coverage…",
  "Extracting key information…",
  "Preparing suggestions…",
];

const LISTING_URL_KEY = "carverity_online_listing_url";

type ScanState = {
  listingUrl?: string;
  startedAt?: string;
  vehicle?: any;
  sections?: any[];
  step?: string;
  type?: string;
};

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const progress = (loadProgress() as ScanState) ?? {};

    const urlFromProgress = progress.listingUrl;
    const urlFromLegacy =
      typeof window !== "undefined"
        ? localStorage.getItem(LISTING_URL_KEY) || undefined
        : undefined;

    const listingUrl = urlFromProgress || urlFromLegacy;

    console.log("▶ Using listing URL >>>", listingUrl);

    if (!listingUrl) {
      alert("Missing listing URL — please start again.");
      navigate("/start-scan", { replace: true });
      return;
    }

    async function runAnalysis() {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        });

        const data = await res.json();
        console.log("ANALYSIS RESULT >>>", data);

        if (!data?.ok) {
          alert("Scan failed — the listing could not be analysed.");
          navigate("/start-scan", { replace: true });
          return;
        }

        const latest = (loadProgress() as ScanState) ?? {};

        saveProgress({
          ...latest,
          type: "online",
          step: "/online/results",
          listingUrl,
          vehicle: data.vehicle ?? {},
          sections: data.sections ?? [],
          startedAt: latest.startedAt ?? new Date().toISOString(),
        });

        console.log(
          "💾 Saved scan result >>>",
          JSON.parse(
            localStorage.getItem("carverity_scan_progress") || "null"
          )
        );

        navigate("/online/results", { replace: true });
      } catch (err) {
        console.error("❌ Analysis failed:", err);
        alert("Scan failed — please try again.");
        navigate("/start-scan", { replace: true });
      }
    }

    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 900);

    runAnalysis();
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-xl font-bold mb-6">Analyzing listing…</h1>

      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`text-sm ${
              i <= stepIndex ? "text-white" : "text-muted-foreground"
            }`}
          >
            {i < stepIndex ? "✅" : "⏳"} {s}
          </div>
        ))}
      </div>
    </div>
  );
}
