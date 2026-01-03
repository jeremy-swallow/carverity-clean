import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setResult(loadOnlineResults());
  }, []);

  function unlockScan() {
    if (!result) return;
    const updated = { ...result, isUnlocked: true };
    saveOnlineResults(updated);
    setResult(updated);
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-slate-200">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-slate-400">
          Run a scan to see your CarVerity results.
        </p>
      </div>
    );
  }

  const {
    vehicle = {},
    confidenceCode,
    previewSummary,
    fullSummary,
    summary,
    isUnlocked,
  } = result;

  const baseSummary = summary || fullSummary || "";
  const preview =
    (previewSummary && previewSummary.trim()) ||
    baseSummary.split("\n").slice(0, 3).join(" ").trim();

  const fullReport = fullSummary || summary || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 text-slate-200">

      {/* CONFIDENCE */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm">
        <h2 className="text-sm text-slate-400 mb-1 uppercase tracking-wide">
          Listing confidence
        </h2>
        <p className="text-lg font-semibold">
          {confidenceCode
            ? `${confidenceCode} — listing confidence`
            : "Not available"}
        </p>
      </section>

      {/* PREVIEW */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm">
        <h2 className="text-sm text-slate-400 mb-2 uppercase tracking-wide">
          CarVerity analysis — preview
        </h2>

        <p className="text-slate-200 leading-relaxed">
          {preview || "No preview available."}
        </p>

        {!isUnlocked && preview && (
          <p className="text-indigo-300 text-sm mt-2">
            You can unlock the full scan to read the complete report.
          </p>
        )}
      </section>

      {/* FULL REPORT */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm relative">
        <h2 className="text-sm text-slate-400 mb-2 uppercase tracking-wide">
          Full CarVerity report
        </h2>

        {!isUnlocked && (
          <div className="relative">
            <div className="blur-sm opacity-60 pointer-events-none">
              <pre className="whitespace-pre-wrap text-slate-300 text-sm leading-relaxed">
                {fullReport}
              </pre>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl border border-white/10">
              <p className="text-slate-200 text-sm px-6 text-center mb-3">
                Unlock to view the full analysis, buyer guidance and ownership notes.
              </p>

              <button
                onClick={unlockScan}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium shadow hover:bg-indigo-400"
              >
                Unlock full scan
              </button>

              <p className="text-xs text-slate-400 mt-2">
                Your full report appears instantly after unlocking.
              </p>
            </div>
          </div>
        )}

        {isUnlocked && (
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
            {fullReport}
          </pre>
        )}
      </section>

      {/* VEHICLE DETAILS */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 shadow-sm">
        <h2 className="text-sm text-slate-400 mb-2 uppercase tracking-wide">
          Vehicle details
        </h2>

        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div>
            <span className="text-slate-400 block">Make</span>
            <span>{vehicle.make || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Model</span>
            <span>{vehicle.model || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Year</span>
            <span>{vehicle.year || "—"}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Kilometres</span>
            <span>{vehicle.kilometres || "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
