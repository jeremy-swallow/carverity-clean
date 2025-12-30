// src/pages/OnlineAnalyzingListing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  "Reading listing content…",
  "Checking vehicle details…",
  "Reviewing photo coverage…",
  "Extracting key information…",
  "Preparing suggestions…",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const url = localStorage.getItem("carverity_listing_url");

    // 🚦 If no URL → send user back to Step 1
    if (!url) {
      navigate("/start-scan", { replace: true });
      return;
    }

    async function runAnalysis() {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),   // ✅ send URL correctly
        });

        const json = await res.json();
        console.log("ANALYSIS RESULT >>>", json);

        // 🚦 If API failed → stay safe instead of continuing
        if (!json?.extracted) {
          alert("Scan failed — please try again.");
          navigate("/online/vehicle-details", { replace: true });
          return;
        }

        // Save extracted data
        localStorage.setItem(
          "carverity_extracted_vehicle",
          JSON.stringify(json.extracted)
        );

        // Continue to details page
        navigate("/online/vehicle-details", { replace: true });

      } catch (err) {
        console.error("Analysis error", err);
        navigate("/online/vehicle-details", { replace: true });
      }
    }

    // Fake progress animation
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
