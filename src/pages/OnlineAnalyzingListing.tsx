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

const LEGACY_KEY = "carverity_listing_url";
const CANONICAL_KEY = "carverity_online_listing_url";

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Try canonical key first, then legacy
    const storedUrl =
      localStorage.getItem(CANONICAL_KEY) ??
      localStorage.getItem(LEGACY_KEY) ??
      "";

    // If no URL anywhere → send user back to step 1
    if (!storedUrl) {
      console.warn("❗ No listing URL found — redirecting user to start");
      navigate("/online/details", { replace: true });
      return;
    }

    // Normalise → always store under canonical key
    localStorage.setItem(CANONICAL_KEY, storedUrl);

    async function runAnalysis(url: string) {
      try {
        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl: url }),
        });

        const json = await res.json();
        console.log("ANALYSIS RESULT >>>", json);

        if (!json?.ok) {
          alert("Scan failed — please try again.");
          navigate("/online/vehicle-details", { replace: true });
          return;
        }

        // Persist extracted vehicle snapshot (non-destructive)
        if (json.vehicle) {
          localStorage.setItem(
            "carverity_extracted_vehicle",
            JSON.stringify(json.vehicle)
          );
        }

        navigate("/online/vehicle-details", { replace: true });
      } catch (err) {
        console.error("❌ Listing analysis failed", err);
        alert("Scan failed — please try again.");
        navigate("/online/vehicle-details", { replace: true });
      }
    }

    // Progress animation
    const interval = setInterval(
      () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)),
      900
    );

    runAnalysis(storedUrl);
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
