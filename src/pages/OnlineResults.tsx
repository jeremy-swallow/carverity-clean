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
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-muted-foreground">
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

  const baseSummaryText: string | null = summary || fullSummary || null;

  const derivedPreview =
    baseSummaryText
      ?.split("\n")
      .slice(0, 4)
      .join(" ")
      .trim() || null;

  const preview = (previewSummary && previewSummary.trim()) || derivedPreview;

  const fullReportText = fullSummary || summary || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </h2>
        <p className="text-white font-medium">
          {confidenceCode
            ? `${confidenceCode} — listing confidence`
            : "Not available"}
        </p>
      </section>

      {/* PREVIEW */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </h2>

        {!preview && (
          <p className="text-muted-foreground">No preview available.</p>
        )}

        {preview && !isUnlocked && (
          <p className="text-slate-200 text-sm leading-relaxed">
            {preview}{" "}
            <span className="text-indigo-400">
              – you can view the full scan for the complete report.
            </span>
          </p>
        )}

        {isUnlocked && (
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
            {preview}
          </pre>
        )}
      </section>

      {/* FULL REPORT */}
      <section className="rounded-lg border border-white/10 p-4 relative">
        <h2 className="text-sm text-muted-foreground mb-1">
          Full CarVerity report
        </h2>

        {/* LOCKED (BLURRED) */}
        {!isUnlocked && (
          <div className="relative">

            {/* The blurred content remains visible but non-interactive */}
            <div className="blur-sm opacity-60 select-none pointer-events-none">
              <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
                {fullReportText}
              </pre>
            </div>

            {/* Overlay — NOW allows clicks on the button */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 rounded-lg border border-white/10">
              <p className="text-slate-200 text-sm px-6 text-center mb-3">
                This section includes the full analysis, buyer considerations,
                negotiation insights and general ownership notes.
              </p>

              <button
                onClick={unlockScan}
                className="px-4 py-2 rounded-md bg-indigo-500 text-white text-sm font-medium shadow hover:bg-indigo-400 transition"
              >
                Unlock full scan
              </button>

              <p className="text-xs text-slate-400 mt-2">
                You’ll see the complete report straight away after unlocking.
              </p>
            </div>
          </div>
        )}

        {/* UNLOCKED (CLEAR VIEW) */}
        {isUnlocked && (
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
            {fullReportText}
          </pre>
        )}
      </section>

      {/* VEHICLE DETAILS */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-2">
          Vehicle details
        </h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground block">Make</span>
            <span>{vehicle.make || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Model</span>
            <span>{vehicle.model || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Year</span>
            <span>{vehicle.year || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Kilometres</span>
            <span>{vehicle.kilometres || "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
