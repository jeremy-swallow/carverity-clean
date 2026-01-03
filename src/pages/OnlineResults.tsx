// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

function confidenceLabel(code?: string | null): string {
  if (!code) return "Listing confidence";
  const upper = code.toUpperCase();
  if (upper === "LOW") return "LOW — listing confidence";
  if (upper === "HIGH") return "HIGH — listing confidence";
  return "MODERATE — listing confidence";
}

export default function OnlineResults() {
  const [data, setData] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setData(stored ?? null);
  }, []);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">
          No results found
        </h1>
        <p className="text-slate-400">
          It looks like there are no saved scan results yet.
        </p>
      </div>
    );
  }

  const unlocked = !!data.isUnlocked;
  const vehicle = data.vehicle || {};
  const previewText =
    (data.previewSummary ?? "") || (data.summary ?? "");
  const fullText = data.fullSummary ?? data.summary ?? "";

  function handleUnlockMock() {
    // This is just the client-side flag flip; real payments already happened
    setData((prev) => {
      if (!prev) return prev;
      const updated: SavedResult = { ...prev, isUnlocked: true };
      saveOnlineResults(updated);
      return updated;
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-slate-100">
      <h1 className="text-2xl font-semibold mb-6">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence stripe */}
      <section className="mb-6 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
        <span>{confidenceLabel(data.confidenceCode)}</span>
      </section>

      {/* Preview card (free) */}
      <section className="mb-6 rounded-lg border border-slate-700 bg-slate-900/60">
        <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-400">
          CarVerity analysis — preview
        </div>
        <div className="px-4 py-4 text-sm whitespace-pre-wrap">
          {previewText ? (
            previewText
          ) : (
            <span className="text-slate-500">
              No preview available.
            </span>
          )}
        </div>
      </section>

      {/* Vehicle details */}
      <section className="mb-6 rounded-lg border border-slate-700 bg-slate-900/60">
        <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Vehicle details
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-4 py-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">Make</div>
            <div>{vehicle.make || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Model</div>
            <div>{vehicle.model || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Year</div>
            <div>{vehicle.year || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Kilometres</div>
            <div>{vehicle.kilometres || "—"}</div>
          </div>
        </div>
      </section>

      {/* Full AI analysis */}
      <section className="mb-10 rounded-lg border border-slate-700 bg-slate-900/60 relative overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Full AI analysis
        </div>

        {/* Content */}
        <div
          className={`px-4 py-4 text-sm whitespace-pre-wrap transition filter ${
            unlocked ? "blur-0" : "blur-sm"
          }`}
        >
          {fullText ? (
            fullText
          ) : (
            <span className="text-slate-500">
              No additional analysis available for this listing.
            </span>
          )}
        </div>

        {/* Lock overlay */}
        {!unlocked && fullText && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
            <div className="rounded-lg bg-slate-900 px-6 py-4 text-center shadow-lg shadow-black/40">
              <p className="mb-3 text-sm text-slate-100">
                Full scan locked — unlock to reveal detailed risk
                signals, service-history context, and negotiation
                insights tailored to this listing.
              </p>
              <button
                type="button"
                onClick={handleUnlockMock}
                className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Unlock full scan
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
