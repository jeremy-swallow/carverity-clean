// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  normaliseVehicle,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [data, setData] = useState<SavedResult | null>(null);

  // Load stored result
  useEffect(() => {
    const stored = loadOnlineResults();

    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }

    const vehicle = normaliseVehicle(stored.vehicle);
    setData({ ...stored, vehicle });
  }, [navigate]);

  // Persist whenever we change data (e.g. unlock)
  useEffect(() => {
    if (data) {
      saveOnlineResults(data);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-4">
          Scan results — AI-assisted review
        </h1>
        <p className="text-sm text-slate-400">Loading your scan…</p>
      </div>
    );
  }

  const vehicle = data.vehicle ?? {};
  const unlocked = data.isUnlocked ?? false;

  const previewText =
    data.preview ??
    data.previewText ??
    data.summary ??
    data.conditionSummary ??
    "";

  const fullText =
    data.fullAnalysis ??
    data.summary ??
    data.conditionSummary ??
    data.preview ??
    data.previewText ??
    "";

  const kilometresDisplay =
    vehicle.kilometres ??
    data.kilometres ??
    null;

  const confidenceLabel =
    data.confidenceAssessment ||
    data.confidenceSummary ||
    (data.confidenceCode
      ? `${data.confidenceCode} — listing confidence`
      : "Confidence assessment");

  function handleUnlock() {
    // For now we just mark this result unlocked and persist it.
    // (Stripe / credits flow can hook in here.)
    setData((prev) => (prev ? { ...prev, isUnlocked: true } : prev));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence banner */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm flex items-center">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 mr-2" />
        <span className="font-medium">
          {confidenceLabel || "Confidence assessment: —"}
        </span>
      </section>

      {/* Preview card */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold">
          CarVerity analysis — preview
        </h2>
        <p className="text-xs text-slate-400">
          (Free preview — the full scan provides a deeper, listing-specific
          breakdown.)
        </p>

        {previewText ? (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed opacity-90">
            {previewText}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">
            No preview available for this listing.
          </p>
        )}
      </section>

      {/* Vehicle details */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 text-sm">
        <h2 className="text-sm font-semibold mb-3">Vehicle details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <div>
            <div className="text-xs text-slate-400">Make</div>
            <div>{vehicle.make || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Year</div>
            <div>{vehicle.year || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Kilometres</div>
            <div>{kilometresDisplay ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Model</div>
            <div>{vehicle.model || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Variant</div>
            <div>{vehicle.variant || "—"}</div>

            {vehicle.importStatus && (
              <>
                <div className="mt-3 text-xs text-slate-400">
                  Import status
                </div>
                <div>{vehicle.importStatus}</div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Full AI analysis */}
      <section className="relative rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 overflow-hidden">
        <h2 className="text-sm font-semibold mb-3">Full AI analysis</h2>

        {fullText ? (
          <>
            <pre
              className={
                "whitespace-pre-wrap text-sm leading-relaxed transition-all" +
                (unlocked ? "" : " blur-sm select-none")
              }
            >
              {fullText}
            </pre>

            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-6 py-3 rounded-md text-center space-y-2 text-sm max-w-md">
                  <p className="text-xs text-slate-200">
                    Full scan locked — unlock to reveal detailed risk signals,
                    tailored buyer checks and negotiation insights for this
                    listing.
                  </p>
                  <button
                    type="button"
                    onClick={handleUnlock}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-400 transition"
                  >
                    Unlock full scan
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">
            No additional analysis available for this listing.
          </p>
        )}
      </section>
    </div>
  );
}
