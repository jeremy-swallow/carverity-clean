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

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const listingUrl =
      localStorage.getItem(LISTING_URL_KEY) ||
      (loadProgress() as any)?.listingUrl ||
      "";

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
          body: JSON.stringify({ listingUrl }), // ✅ send correct param
        });

        const json = await res.json();
        console.log("ANALYSIS RESULT >>>", json);

        if (!json?.ok) {
          alert("Scan failed — the listing could not be analysed.");
          navigate("/online/vehicle-details", { replace: true });
          return;
        }

        const extracted = json?.vehicle ?? {};

        // Save into progress
        const progress = (loadProgress() as any) ?? {};
        const update = {
          ...progress,
          type: "online" as const,
          step: "/online/vehicle",
          listingUrl,
          vehicle: extracted,
          startedAt: progress.startedAt ?? new Date().toISOString(),
        };

        saveProgress(update);

        // Continue to vehicle details page
        navigate("/online/vehicle-details", { replace: true });
      } catch (err) {
        console.error("Analysis error", err);
        alert("Scan failed — please try again.");
        navigate("/online/vehicle-details", { replace: true });
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
