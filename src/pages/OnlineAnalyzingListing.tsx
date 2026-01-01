import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

const LISTING_URL_KEY = "carverity_online_listing_url";

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
    const progress: any = loadProgress() ?? {};

    const listingUrlFromProgress =
      (progress.listingUrl as string | undefined) || undefined;

    const listingUrlFromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem(LISTING_URL_KEY) || undefined
        : undefined;

    const listingUrl = listingUrlFromProgress || listingUrlFromStorage;

    console.log("🔗 Using listing URL >>>", listingUrl);

    if (!listingUrl) {
      alert("Missing listing URL — please start again.");
      navigate("/start-scan", { replace: true });
      return;
    }

    async function runAnalysis() {
      try {
        for (let i = 0; i < STEPS.length; i++) {
          setStepIndex(i);
          await new Promise((r) => setTimeout(r, 600));
        }

        const res = await fetch("/api/analyze-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: listingUrl }),
        });

        const data = await res.json();
        console.log("ANALYSIS RESULT >>>", data);

        if (!res.ok || !data.ok) {
          alert("Scan failed — the listing could not be analysed.");
          navigate("/start-scan", { replace: true });
          return;
        }

        const latest = (loadProgress() as any) ?? {};

        saveProgress({
          ...latest,
          type: "online",
          step: "/online/results",
          listingUrl,
          vehicle: data.vehicle ?? (latest?.vehicle ?? {}),
          sections: data.sections ?? [],
        });

        navigate("/online/results", { replace: true });
      } catch (err) {
        console.error("❌ Analysis failed:", err);
        alert("Scan failed — please try again.");
        navigate("/start-scan", { replace: true });
      }
    }

    runAnalysis();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-xl font-semibold mb-6">Analyzing listing…</h1>

        <ul className="space-y-2 text-sm text-slate-400">
          {STEPS.map((text, i) => (
            <li key={i}>{i <= stepIndex ? "✳️" : "⏳"} {text}</li>
          ))}
        </ul>
      </main>
    </div>
  );
}
