// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  normaliseKilometres,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [data, setData] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      // No result saved – send the user back to start an online scan
      navigate("/scan/online", { replace: true });
      return;
    }

    // Ensure vehicle object & unlock flag always exist
    if (!stored.vehicle) {
      stored.vehicle = {};
    }
    if (stored.isUnlocked === undefined) {
      stored.isUnlocked = false;
    }

    setData(stored);
  }, [navigate]);

  function handleUnlock() {
    if (!data) return;
    const updated: SavedResult = { ...data, isUnlocked: true };
    saveOnlineResults(updated);
    setData(updated);
  }

  if (!data) return null;

  const v = data.vehicle ?? {};

  // Support both the new vehicle.kilometres and the older root kilometres
  const kmValue = v.kilometres ?? data.kilometres ?? null;

  const previewText =
    data.previewText ??
    data.summary ??
    "No preview is available for this listing.";

  const fullText =
    data.fullAnalysis ??
    data.conditionSummary ??
    data.summary ??
    "No additional analysis available for this listing.";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence pill */}
      {data.confidenceSummary && (
        <div className="border border-white/10 rounded-lg px-4 py-3 bg-slate-900/40 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-2 align-middle" />
          <span>
            <strong>Confidence assessment:</strong> {data.confidenceSummary}
          </span>
        </div>
      )}

      {/* Preview block */}
      <section className="border border-white/10 rounded-lg p-4 bg-slate-900/40">
        <h2 className="font-semibold mb-1 text-sm">
          CarVerity analysis — preview
        </h2>
        <p className="text-xs opacity-70 mb-3">
          (Free preview — the full scan provides a deeper, listing-specific
          breakdown.)
        </p>

        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {previewText}
        </div>
      </section>

      {/* Vehicle details */}
      <section className="border border-white/10 rounded-lg p-4 bg-slate-900/40">
        <h3 className="font-semibold mb-3 text-sm">Vehicle details</h3>

        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <div>Make: {v.make ?? "—"}</div>
          <div>Model: {v.model ?? "—"}</div>
          <div>Year: {v.year ?? "—"}</div>
          <div>Variant: {v.variant ?? "—"}</div>
          <div>Kilometres: {normaliseKilometres(kmValue)}</div>
          {v.importStatus && <div>Import status: {v.importStatus}</div>}
          {v.owners && <div>Known owners: {v.owners}</div>}
        </div>
      </section>

      {/* Full analysis (locked / unlocked) */}
      <section className="border border-white/10 rounded-lg p-4 bg-slate-900/40 relative overflow-hidden">
        <h3 className="font-semibold mb-3 text-sm">Full AI analysis</h3>

        {/* Content area */}
        <pre className="whitespace-pre-wrap text-sm leading-relaxed opacity-90">
          {fullText}
        </pre>

        {/* Lock overlay */}
        {!data.isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center px-4">
              <p className="text-xs opacity-80 mb-3">
                Full scan locked — unlock to reveal detailed risk signals,
                tailored buyer checks and negotiation insights for this listing.
              </p>
              <button
                type="button"
                onClick={handleUnlock}
                className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-400"
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
