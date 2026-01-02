// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  // Use any here to keep TS quiet while we stabilise the shape
  const [data, setData] = useState<any | null>(null);
  const [isUnlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      navigate("/scan/online", { replace: true });
      return;
    }

    setData(stored);
    setUnlocked(!!stored.isUnlocked);
  }, [navigate]);

  if (!data) return null;

  /* ------------------------------
   * Derived labels / helpers
   * ------------------------------ */

  const confidenceLabel: string =
    data.confidenceSummary ??
    (data.confidenceCode === "HIGH"
      ? "High — looks solid overall"
      : data.confidenceCode === "LOW"
      ? "Low — proceed with caution"
      : data.confidenceCode === "MODERATE"
      ? "Moderate — a few things to confirm"
      : "Not assessed");

  const vehicle = data.vehicle || {};
  const kilometres =
    data.kilometres ??
    vehicle.kilometres ??
    vehicle.kilometers ??
    vehicle.km ??
    null;

  const previewText: string =
    data.summary || data.conditionSummary || data.preview || "";

  const fullAnalysisText: string =
    data.fullAnalysis ||
    (Array.isArray(data.sections)
      ? data.sections
          .map((s: any) => `${s.title.toUpperCase()}\n\n${s.content}`)
          .join("\n\n")
      : "");

  function handleUnlock() {
    const updated = { ...data, isUnlocked: true };
    saveOnlineResults(updated);
    setData(updated);
    setUnlocked(true);
  }

  /* ------------------------------
   * Render
   * ------------------------------ */

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Title */}
      <h1 className="text-2xl font-semibold">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence banner */}
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span>
            <strong>Confidence assessment:</strong> {confidenceLabel}
          </span>
        </span>
      </div>

      {/* Preview */}
      {previewText && (
        <section className="rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              CarVerity analysis — preview
            </h2>
            <span className="text-[11px] opacity-70">
              (Free preview — the full scan provides a deeper,
              listing-specific breakdown.)
            </span>
          </div>

          <p className="leading-relaxed whitespace-pre-wrap">
            {previewText}
          </p>
        </section>
      )}

      {/* Vehicle details */}
      <section className="rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-sm grid grid-cols-2 gap-y-1">
        <div className="space-y-1">
          <div>Make: {vehicle.make || "—"}</div>
          <div>Year: {vehicle.year || "—"}</div>
          <div>Kilometres: {kilometres ?? "—"}</div>
        </div>
        <div className="space-y-1">
          <div>Model: {vehicle.model || "—"}</div>
          <div>Variant: {vehicle.variant || "—"}</div>
        </div>
      </section>

      {/* Full AI analysis */}
      <section className="rounded-lg border border-white/10 bg-white/5 px-4 py-4 text-sm relative overflow-hidden">
        <h2 className="font-semibold text-base mb-2">Full AI analysis</h2>

        {/* Body content */}
        <div
          className={
            isUnlocked
              ? "space-y-2"
              : "space-y-2 blur-sm select-none"
          }
        >
          {fullAnalysisText
            ? fullAnalysisText.split("\n").map((line, idx) =>
                line.trim() ? (
                  <p key={idx}>{line}</p>
                ) : (
                  <p key={idx} className="h-1" />
                )
              )
            : (
              <p className="opacity-70">
                No additional analysis available for this listing.
              </p>
            )}
        </div>

        {/* Lock overlay */}
        {!isUnlocked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto text-center space-y-2 bg-slate-950/80 px-4 py-3 rounded-lg shadow-lg">
              <p className="text-xs opacity-80">
                Full scan locked — unlock to reveal detailed risk signals,
                tailored buyer checks and negotiation insights for this
                listing.
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
