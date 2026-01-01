// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  // Load stored scan on mount
  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored ?? null);
  }, []);

  // If nothing stored → show fallback page
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground mb-6">
          Run a scan to view AI-assisted results.
        </p>
      </div>
    );
  }

  // Normalised safe fields (result is non-null beyond this point)
  const vehicle = result.vehicle ?? {};
  const sections = result.sections ?? [];

  // If the API did not return a summary, show a friendly fallback
  const summary =
    (result.summary?.trim() || result.conditionSummary?.trim()) ||
    "No AI summary was returned for this listing — but the details below were successfully extracted.";

  function handleContinue() {
    // Extra TS/runtime guard in case this somehow runs with no result
    if (!result) return;

    // ✅ Guarantee required literals + fallback strings
    const updated: SavedResult = {
      ...result,
      type: "online",
      step: "/online/next-actions",
      createdAt: result.createdAt ?? new Date().toISOString(),
      listingUrl: result.listingUrl ?? "",
      vehicle: result.vehicle ?? {},
      sections: result.sections ?? [],
      photos: result.photos ?? { listing: [], meta: [] },
      kilometres: result.kilometres ?? null, // coerce away `undefined`
    };

    saveOnlineResults(updated);
    setResult(updated);

    navigate("/online/next-actions", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>

      <p className="text-sm mb-6">
        Listing analysed:{" "}
        <a
          href={result.listingUrl || "#"}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          {result.listingUrl || "Unknown source"}
        </a>
      </p>

      {/* SUMMARY PANEL */}
      <div className="border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">CarVerity review summary</h2>
        <p className="text-muted-foreground whitespace-pre-line">{summary}</p>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <p>Make: {vehicle.make ?? "—"}</p>
        <p>Model: {vehicle.model ?? "—"}</p>
        <p>Year: {vehicle.year ?? "—"}</p>
        <p>Variant: {vehicle.variant ?? "—"}</p>
        <p>
          Import status:{" "}
          {vehicle.importStatus ?? "Sold new in Australia (default)"}
        </p>
        <p>Kilometres: {vehicle.kilometres ?? "Not specified"}</p>
      </div>

      {/* EXTRA AI SECTIONS (if any) */}
      {sections.length === 0 && (
        <p className="text-muted-foreground mb-10">
          No additional sections returned from the scan.
        </p>
      )}

      {sections.length > 0 && (
        <div className="space-y-4 mb-10">
          {sections.map((s, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {s.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CONTINUE BUTTON */}
      <button
        onClick={handleContinue}
        className="bg-blue-600 text-white px-5 py-2 rounded shadow"
      >
        Continue
      </button>
    </div>
  );
}
