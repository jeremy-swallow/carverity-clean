// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    setResult(loadOnlineResults());
  }, []);

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
    vehicle,
    confidenceCode,
    isUnlocked,
    previewSummary,
    fullSummary,
    summary,
  } = result;

  const previewText =
    previewSummary ??
    summary
      ?.split("\n")
      .slice(0, 3)
      .join(" ")
      .trim() ??
    null;

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

      {/* PREVIEW / FULL */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </h2>

        {!previewText && !fullSummary && (
          <p className="text-muted-foreground">
            No preview available.
          </p>
        )}

        {!isUnlocked && previewText && (
          <p className="text-slate-200 text-sm leading-relaxed">
            {previewText}…{" "}
            <span className="text-indigo-400">
              Unlock full scan to read the complete report.
            </span>
          </p>
        )}

        {isUnlocked && (
          <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
            {fullSummary ?? summary ?? ""}
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
            <span>{vehicle?.make || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Model</span>
            <span>{vehicle?.model || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Year</span>
            <span>{vehicle?.year || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Kilometres</span>
            <span>{vehicle?.kilometres || "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
