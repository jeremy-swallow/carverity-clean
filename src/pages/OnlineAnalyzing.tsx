import { useEffect } from "react";
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

  // Take the first few sentences up to ~320 characters
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  let output = "";

  for (const sentence of sentences) {
    const next = output ? `${output} ${sentence}` : sentence;
    if (next.length > 320) break;
    output = next;
  }

  // Fallback: just slice the string if sentence logic fails
  return output || cleaned.slice(0, 320);
}

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const listingUrl = localStorage.getItem(LISTING_URL_KEY);

    if (!listingUrl) {
      console.warn("⚠️ No listing URL — aborting scan");
      navigate("/start-scan", { replace: true });
      return;
    }

    console.log("🚀 Running scan for:", listingUrl);
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

      // Normalise vehicle info from the model/scraper
      const vehicle = normaliseVehicle(data.vehicle ?? {});

      // The API currently returns a single `summary` string.
      // We treat this as the full report, and derive a short preview from it.
      const rawSummary: string | null =
        data.summary ??
        data.fullSummary ??
        data.previewSummary ??
        null;

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

        // High-level confidence from the model
        confidenceCode: data.confidenceCode ?? undefined,

        // New split summaries
        previewSummary,
        fullSummary,

        // Backwards-compat support: some code still reads `summary`
        summary: rawSummary,

        sections: [],
        signals: [],

        photos: { listing: [], meta: [] },
        isUnlocked: false, // full report gated for now; can be wired later

        source: data.source ?? "gemini-2.5-flash",
        analysisSource: "online-listing-v1",
        sellerType: data.sellerType ?? undefined,

        // Required field
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
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-100">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>
      <p className="text-sm text-slate-400">
        Running your online listing through CarVerity…
      </p>
    </div>
  );
}
