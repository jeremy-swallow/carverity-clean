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

    setData({
      ...stored,
      vehicle: normaliseVehicle(stored.vehicle),
    });
  }, [navigate]);

  useEffect(() => {
    if (data) saveOnlineResults(data);
  }, [data]);

  if (!data) return null;

  const unlocked = data.isUnlocked ?? false;
  const preview =
    data.previewText ||
    data.summary ||
    "";
  const full =
    data.fullAnalysis ||
    data.summary ||
    "";

  function handleUnlock() {
    setData(prev => prev ? { ...prev, isUnlocked: true } : prev);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI-assisted review
      </h1>

      {/* Preview */}
      <section className="rounded-lg border bg-slate-900/70 px-5 py-4">
        <h2 className="text-sm font-semibold">CarVerity analysis — preview</h2>

        {preview ? (
          <pre className="whitespace-pre-wrap text-sm">
            {preview}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">
            No preview available.
          </p>
        )}
      </section>

      {/* Full Scan */}
      <section className="relative rounded-lg border bg-slate-900/70 px-5 py-4">
        <h2 className="text-sm font-semibold mb-3">Full AI analysis</h2>

        {full ? (
          <>
            <pre
              className={
                "whitespace-pre-wrap text-sm" +
                (!unlocked ? " blur-sm select-none" : "")
              }
            >
              {full}
            </pre>

              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-slate-950/85 px-6 py-3 rounded-md text-center">
                    <p className="text-xs mb-2">
                      Full scan locked — unlock to reveal detailed insights.
                    </p>
                    <button
                      onClick={handleUnlock}
                      className="bg-indigo-500 text-white px-3 py-1 rounded"
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
