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

  useEffect(() => {
    const stored = loadOnlineResults();

    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }

    const vehicle = normaliseVehicle(stored.vehicle);

    // 🔥 SAFETY NORMALISATION (UI fallback)
    const preview =
      stored.previewText ||
      stored.summary ||
      "";

    const full =
      stored.fullAnalysis ||
      stored.summary ||
      "";

    setData({
      ...stored,
      vehicle,
      previewText: preview,
      fullAnalysis: full,
    });
  }, [navigate]);

  useEffect(() => {
    if (data) saveOnlineResults(data);
  }, [data]);

  if (!data) return null;

  const unlocked = data.isUnlocked ?? false;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm">
        <span className="font-medium">
          {data.confidenceCode
            ? `${data.confidenceCode} — listing confidence`
            : "Listing confidence"}
        </span>
      </section>

      {/* Preview */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4">
        <h2 className="text-sm font-semibold">
          CarVerity analysis — preview
        </h2>

        {data.previewText ? (
          <pre className="whitespace-pre-wrap text-sm opacity-90 leading-relaxed">
            {data.previewText}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">
            No preview available.
          </p>
        )}
      </section>

      {/* Vehicle details */}
      <section className="rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4">
        <h2 className="text-sm font-semibold mb-3">Vehicle details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
          <div>
            <div className="text-xs text-slate-400">Make</div>
            <div>{data.vehicle?.make || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Year</div>
            <div>{data.vehicle?.year || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Kilometres</div>
            <div>{data.vehicle?.kilometres ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs text-slate-400">Model</div>
            <div>{data.vehicle?.model || "—"}</div>

            <div className="mt-3 text-xs text-slate-400">Variant</div>
            <div>{data.vehicle?.variant || "—"}</div>
          </div>
        </div>
      </section>

      {/* Full analysis */}
      <section className="relative rounded-lg border border-slate-700 bg-slate-900/70 px-5 py-4 overflow-hidden">
        <h2 className="text-sm font-semibold mb-3">Full AI analysis</h2>

        {data.fullAnalysis ? (
          <>
            <pre
              className={
                "whitespace-pre-wrap text-sm leading-relaxed transition-all" +
                (unlocked ? "" : " blur-sm select-none")
              }
            >
              {data.fullAnalysis}
            </pre>

            {!unlocked && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto bg-slate-950/85 px-6 py-3 rounded text-sm max-w-md text-center">
                  <p className="text-xs mb-2">
                    Full scan locked — unlock to reveal detailed risk
                    signals, verification checks and negotiation insights.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setData(prev => prev ? { ...prev, isUnlocked: true } : prev)
                    }
                    className="bg-indigo-500 text-white px-4 py-1.5 rounded"
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
