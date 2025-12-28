/* src/pages/OnlineResults.tsx */

import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  unlockOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

type SummaryBlock = {
  overallRecommendation?: "ok" | "caution" | "high-risk" | "unknown";
  rationale?: string;
};

type RiskSignal = { title?: string; message?: string };

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  // Extra richer fields (NOT part of SavedResult schema)
  const [summary, setSummary] = useState<SummaryBlock | null>(null);
  const [riskSignals, setRiskSignals] = useState<RiskSignal[] | null>(null);

  useEffect(() => {
    const raw = loadOnlineResults();

    if (!raw || typeof raw !== "object") {
      setResult(null);
      return;
    }

    // ---- Normalise base SavedResult (unchanged shape) ----
    const stored: SavedResult = {
      createdAt: raw.createdAt ?? "",
      source: raw.source ?? "unknown",
      sellerType: raw.sellerType ?? "unknown",
      listingUrl: raw.listingUrl ?? "",
      signals: Array.isArray(raw.signals) ? raw.signals : [],
      sections: Array.isArray(raw.sections) ? raw.sections : [],
      analysisSource: raw.analysisSource,
      isUnlocked: raw.isUnlocked ?? false,
    };

    setResult(stored);

    // ---- Read richer optional fields safely ----
    const asAny = raw as any;
    if (asAny?.summary) setSummary(asAny.summary);
    if (Array.isArray(asAny?.riskSignals)) setRiskSignals(asAny.riskSignals);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </div>
    );
  }

  const locked = !result.isUnlocked;

  function handleUnlock() {
    unlockOnlineResults();
    const updated = loadOnlineResults();
    setResult(updated);

    // reload richer fields too
    const asAny = updated as any;
    if (asAny?.summary) setSummary(asAny.summary);
    if (Array.isArray(asAny?.riskSignals)) setRiskSignals(asAny.riskSignals);
  }

  function badgeForRecommendation(state?: string) {
    switch (state) {
      case "ok":
        return (
          <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs font-semibold">
            Looks reasonable
          </span>
        );
      case "high-risk":
        return (
          <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-semibold">
            High-risk listing
          </span>
        );
      case "caution":
      default:
        return (
          <span className="px-2 py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-semibold">
            Proceed with caution
          </span>
        );
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI analysis
      </h1>

      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        {result.listingUrl}
      </p>

      {/* ===== Headline Summary ===== */}
      {summary && (
        <div
          className={`mb-8 rounded-xl border border-white/10 p-4 ${
            locked ? "blur-sm pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Overall assessment</h2>
            {badgeForRecommendation(summary.overallRecommendation)}
          </div>

          <p className="text-sm text-muted-foreground">
            {summary.rationale ?? ""}
          </p>
        </div>
      )}

      {/* ===== Risk Signals ===== */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key risk signals</h2>

        {riskSignals && riskSignals.length > 0 ? (
          <ul className={`space-y-2 ${locked ? "blur-sm" : ""}`}>
            {riskSignals.map((s, i) => (
              <li
                key={i}
                className="border border-white/10 rounded-lg p-3 text-sm"
              >
                <div className="font-medium">
                  {s?.title ?? "Unlabeled signal"}
                </div>
                <div className="text-muted-foreground">
                  {s?.message ?? ""}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No explicit risk signals detected in this listing.
          </p>
        )}
      </div>

      {/* ===== Analysis Sections (existing behaviour) ===== */}
      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Analysis details</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section: any, i: number) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-4 bg-black/20"
            >
              <h3 className="font-medium mb-1">
                {section?.title ?? "Untitled section"}
              </h3>

              {Array.isArray(section?.items) ? (
                <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                  {section.items.map((it: any, j: number) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {section?.content ?? ""}
                </p>
              )}

              {section?.disclaimer && (
                <p className="mt-2 text-xs text-muted-foreground/80">
                  {section.disclaimer}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No analysis sections returned.
          </p>
        )}
      </div>

      {/* ===== Unlock Banner ===== */}
      {locked && (
        <div className="mt-6 p-4 border border-white/20 rounded-lg bg-black/30">
          <p className="mb-3 text-sm text-muted-foreground">
            You’re viewing a preview. Unlock the full report without using
            another credit.
          </p>

          <button
            onClick={handleUnlock}
            className="px-4 py-2 rounded bg-blue-500 text-black font-semibold"
          >
            Unlock full report
          </button>
        </div>
      )}
    </div>
  );
}
