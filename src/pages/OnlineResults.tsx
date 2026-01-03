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

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }
    setData({ ...stored, vehicle: normaliseVehicle(stored.vehicle) });
  }, [navigate]);

  useEffect(() => {
    if (data) saveOnlineResults(data);
  }, [data]);

  if (!data) return null;

  const unlocked = data.isUnlocked;
  const preview = data.previewText ?? "";
  const full = data.fullAnalysis ?? "";
  const vehicle = data.vehicle ?? {};

  function handleUnlock() {
    setData(prev => (prev ? { ...prev, isUnlocked: true } : prev));
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
          {data.confidenceSummary ||
            (data.confidenceCode
              ? `${data.confidenceCode} — listing confidence`
              : "Confidence assessment")}
        </span>
      </section>

      {/* Preview — reassurance only */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 space-y-2">
        <h2 className="text-sm font-semibold">CarVerity analysis — preview</h2>
        <p className="text-xs text-slate-400">
          (Free preview — the full scan provides listing-specific risks,
          verification checks and negotiation insights.)
        </p>

        {preview ? (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed opacity-90">
            {preview}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">No preview available.</p>
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
            <div>{vehicle.kilometres ?? "—"}</div>
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

      {/* Full scan — real value gated */}
      <section className="relative rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 overflow-hidden">
        <h2 className="text-sm font-semibold mb-3">Full AI analysis</h2>

        {full ? (
          <>
            <pre
              className={
                "whitespace-pre-wrap text-sm leading-relaxed transition-all" +
                (unlocked ? "" : " blur-sm select-none")
              }
            >
              {full}
            </pre>

            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-6 py-3 rounded-md text-center space-y-2 text-sm max-w-md">
                  <p className="text-xs text-slate-200">
                    Unlock the full scan to reveal:
                    <br />• listing-specific risk signals
                    <br />• verification checks for in-person inspection
                    <br />• negotiation insights based on condition cues
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
