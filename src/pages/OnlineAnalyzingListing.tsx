import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const STEPS = [
  "Fetching the listing page",
  "Looking for vehicle details",
  "Detecting listing source",
  "Checking for photo suitability",
  "Preparing data for the next step",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();

  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    const url = (progress as any)?.listingUrl;

    if (!url) {
      console.warn("No listing URL — sending user back");
      navigate("/online/details", { replace: true });
      return;
    }

    async function runAnalysis() {
      // Animate progress UI first
      for (let i = 0; i < STEPS.length; i++) {
        setStepIndex(i);
        await new Promise((r) => setTimeout(r, 700));
      }

      // 🔍 Call backend listing fetcher
      try {
        const res = await fetch("/api/scrape-listing-lite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingUrl: url }),
        });

        const json = await res.json();

        // Save extracted hints (non-blocking, editable later)
        saveProgress({
          ...progress,
          vehicle: {
            ...(progress as any)?.vehicle ?? {},
            make: json?.vehicle?.make ?? "",
            model: json?.vehicle?.model ?? "",
            year: json?.vehicle?.year ?? "",
            variant: json?.vehicle?.variant ?? "",
          },
          photos: {
            ...(progress as any)?.photos ?? {},
            listing: json?.photos?.slice(0, 8) ?? [],
          },
        });

        navigate("/online/vehicle-details", { replace: true });
      } catch (err) {
        console.error("Scrape failed — continuing manually", err);
        navigate("/online/vehicle-details", { replace: true });
      }
    }

    runAnalysis();
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-6">
      <span className="text-xs tracking-wider uppercase text-slate-400">
        Online scan · Listing analysis
      </span>

      <h1 className="text-2xl font-extrabold text-white">
        Analyzing the listing…
      </h1>

      <p className="text-sm text-slate-300">
        CarVerity is collecting helpful information before you continue.
        You can still review and change everything on the next screen.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {STEPS.map((label, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;

          return (
            <div
              key={i}
              className={`px-4 py-3 rounded-lg border ${
                done
                  ? "border-green-400/40 bg-green-900/10"
                  : active
                  ? "border-blue-400/40 bg-blue-900/10"
                  : "border-white/10 bg-slate-900/40"
              }`}
            >
              <span className="text-sm">
                {done ? "✔ " : active ? "• " : "○ "}
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
