// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface VehicleData {
  make?: string;
  model?: string;
  year?: string | number;
  variant?: string;
  importStatus?: string;
}

interface SavedResult {
  type?: string;
  step?: string;
  listingUrl?: string | null;
  createdAt?: string;
  vehicle?: VehicleData;
  sections?: { title: string; content: string }[];
  conditionSummary?: string;
  summary?: string;
}

const PROGRESS_KEY = "carverity_scan_progress";
const RESULTS_KEY = "carverity_online_results_v2";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    try {
      const rawProgress = localStorage.getItem(PROGRESS_KEY);
      const rawResult = localStorage.getItem(RESULTS_KEY);

      const parsedProgress =
        rawProgress ? (JSON.parse(rawProgress) as any) : null;
      const parsedResult =
        rawResult ? (JSON.parse(rawResult) as any) : null;

      // Prefer dedicated results, fall back to progress
      const resolved: SavedResult =
        parsedResult?.type === "online"
          ? parsedResult
          : parsedProgress?.type === "online"
          ? parsedProgress
          : null;

      if (!resolved) {
        setResult(null);
        return;
      }

      setResult({
        ...resolved,
        vehicle: resolved.vehicle ?? {},
        sections: Array.isArray(resolved.sections)
          ? resolved.sections
          : [],
      });
    } catch (err) {
      console.error("❌ Failed to load result:", err);
      setResult(null);
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">
          No results available
        </h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>

        <div className="mt-6">
          <Link
            to="/start-scan"
            className="text-emerald-400 underline"
          >
            Start a new scan
          </Link>
        </div>
      </div>
    );
  }

  const v = result.vehicle ?? {};

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold mb-3">
        Scan results — AI-assisted review
      </h1>

      {result.listingUrl && (
        <p className="text-sm mb-6">
          Listing analysed:{" "}
          <a
            href={result.listingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 underline"
          >
            {result.listingUrl}
          </a>
        </p>
      )}

      {/* SUMMARY */}
      <section className="mb-6 p-4 rounded-lg bg-slate-800 border border-white/10">
        <h2 className="font-semibold mb-2">CarVerity review summary</h2>
        <p className="text-sm text-slate-300">
          {result.summary?.trim() || "No summary available for this scan."}
        </p>
      </section>

      {/* VEHICLE DETAILS */}
      <section className="mb-6 p-4 rounded-lg bg-slate-800 border border-white/10">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <div className="text-sm space-y-1">
          <div>Make: {v.make || "—"}</div>
          <div>Model: {v.model || "—"}</div>
          <div>Year: {v.year || "—"}</div>
          <div>Variant: {v.variant || "—"}</div>
          <div>
            Import status:{" "}
            {v.importStatus || "Not specified in listing"}
          </div>
        </div>
      </section>

      {/* EXTRA SECTIONS */}
      <section className="space-y-4">
        {result.sections?.length ? (
          result.sections.map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-slate-800 border border-white/10"
            >
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-slate-300">{s.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400">
            No additional sections returned.
          </p>
        )}
      </section>
    </div>
  );
}
