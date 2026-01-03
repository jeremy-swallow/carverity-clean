import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveOnlineResults,
  type SavedResult,
  normaliseVehicle,
  LISTING_URL_KEY,
} from "../utils/onlineResults";

function buildPreview(summary: string): string {
  const cleaned = summary.trim();
  if (!cleaned) return "";
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let output = "";
  for (const s of sentences) {
    const next = output ? `${output} ${s}` : s;
    if (next.length > 320) break;
    output = next;
  }
  return output || cleaned.slice(0, 320);
}

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  const steps = [
    "Fetching the listing details…",
    "Extracting key vehicle information…",
    "Reviewing the listing text…",
    "Preparing your CarVerity report…",
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Step rhythm
  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((i) => (i + 1) % steps.length);
    }, 1600);
    return () => clearInterval(timer);
  }, []);

  // Ambient looping progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 0;
        return p + 2.2;
      });
    }, 90);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    runScan(listingUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runScan(listingUrl: string) {
    try {
      const res = await fetch("/api/analyze-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Scan failed");

      const vehicle = normaliseVehicle(data.vehicle ?? {});

      const rawSummary: string | null =
        data.summary ?? data.fullSummary ?? data.previewSummary ?? null;

      const fullSummary: string | null = rawSummary ?? null;
      const previewSummary: string | null = rawSummary
        ? buildPreview(rawSummary)
        : null;

      const saved: SavedResult = {
        type: "online",
        step: "analysis-complete",
        createdAt: new Date().toISOString(),

        listingUrl,
        vehicle: {
          make: vehicle.make ?? "",
          model: vehicle.model ?? "",
          year: vehicle.year ?? "",
          kilometres: vehicle.kilometres ?? "",
          ...vehicle,
        },

        confidenceCode: data.confidenceCode ?? undefined,

        previewSummary,
        fullSummary,
        summary: rawSummary,

        sections: [],
        signals: [],

        photos: { listing: [], meta: [] },
        isUnlocked: false,

        source: data.source ?? "gemini-2.5-flash",
        analysisSource: "online-listing-v1",
        sellerType: data.sellerType ?? undefined,

        conditionSummary: "",

        kilometres: vehicle.kilometres ?? "",
        owners: "",
        notes: "",
      };

      saveOnlineResults(saved);

      navigate("/scan/online/results", { replace: true });
    } catch (err) {
      console.error("❌ Analysis error:", err);
      navigate("/scan/online", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-xl">

        {/* LOGO WITH SOFT GLOW */}
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-[pulse_2.4s_ease-in-out_infinite]" />
          <img
            src="/logo.png"
            alt="CarVerity logo"
            className="relative w-24 h-24 mx-auto opacity-95"
          />
        </div>

        {/* TITLE */}
        <h1 className="text-xl font-semibold mb-2">
          Scanning the listing…
        </h1>

        <p className="text-slate-400 text-sm mb-6">
          CarVerity is thoughtfully reviewing the listing to help you feel
          confident about your next steps.
        </p>

        {/* DOT STEP RHYTHM */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === stepIndex
                  ? "bg-indigo-400 scale-110"
                  : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        <p className="text-sm text-indigo-300 font-medium h-6">
          {steps[stepIndex]}
        </p>

        {/* AMBIENT PROGRESS BAR */}
        <div className="mt-5 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-slate-500 mt-6">
          This usually takes a few moments — thanks for your patience.
        </p>
      </div>
    </div>
  );
}
