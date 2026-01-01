import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const LISTING_URL_KEY = "carverity_online_listing_url";

const STEPS = [
  "Reading listing content...",
  "Checking vehicle details...",
  "Reviewing photo coverage...",
  "Extracting key information...",
  "Preparing suggestions...",
];

export default function OnlineAnalyzingListing() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const stored = loadOnlineResults() ?? {};

    const listingUrlFromProgress =
      (stored as any)?.listingUrl as string | undefined;

    const listingUrlFromStorage =
      localStorage.getItem(LISTING_URL_KEY) || undefined;

    const listingUrlRaw = listingUrlFromProgress || listingUrlFromStorage;

    // normalize undefined → null for SavedResult type
    const listingUrl = listingUrlRaw ?? null;

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
        console.log("🧠 ANALYSIS RESULT >>>", data);

        if (!data?.ok) {
          alert("Scan failed — the listing could not be analysed.");
          navigate("/start-scan", { replace: true });
          return;
        }

        const result: SavedResult = {
          type: "online",
          step: "/online/vehicle-details", // ➜ Next page = confirm details
          createdAt:
            (stored as any)?.createdAt ?? new Date().toISOString(),

          listingUrl,

          vehicle: data.vehicle ?? {},
          sections: data.sections ?? [],
          photos: data.photos ?? [],     // up to 8 later
          kilometres: data.kilometres ?? null,

          // NEW — required field
          signals: [],

          isUnlocked: true,
          analysisSource: "auto-search+extractor",
          source: "listing",
          conditionSummary: "",
          summary: "",
          notes: "",
        };

        saveOnlineResults(result);
        console.log("💾 Saved scan state >>>", result);

        navigate("/online/vehicle-details", { replace: true });

      } catch (err) {
        console.error("❌ Analysis failed:", err);
        alert("Scan failed — please try again.");
        navigate("/start-scan", { replace: true });
      }
    }

    runAnalysis();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold mb-6">Analyzing listing...</h1>

      <ul className="text-muted-foreground space-y-2">
        {STEPS.map((text, i) => (
          <li key={i}>
            {i <= stepIndex ? "⏳" : "✖️"} {text}
          </li>
        ))}
      </ul>

      <p className="mt-8 opacity-70">This may take a few seconds.</p>
    </div>
  );
}
