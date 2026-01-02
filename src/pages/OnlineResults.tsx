// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const [data, setData] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) {
      setData(stored);
    }
  }, []);

  // Nothing stored – send user to start a scan
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold mb-2">No results found</h1>
        <p className="text-muted-foreground">
          It looks like there are no saved online scan results yet.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/scan/online"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start an online scan
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  // ---------- helpers ----------
  const vehicle = data.vehicle ?? {};

  const kilometresDisplay =
    data.kilometres == null || data.kilometres === ""
      ? "—"
      : typeof data.kilometres === "number"
      ? data.kilometres.toLocaleString()
      : data.kilometres;

  const confidenceLabel =
    data.confidenceCode === "HIGH"
      ? "High — looks solid overall"
      : data.confidenceCode === "LOW"
      ? "Low — proceed with caution"
      : data.confidenceCode === "MODERATE"
      ? "Moderate — a few things to confirm"
      : "Not assessed";

  const hasSections = Array.isArray(data.sections) && data.sections.length > 0;

  function handleUnlock() {
    if (!data) return;

    const updated: SavedResult = {
      ...data,
      isUnlocked: true,
    };

    saveOnlineResults(updated);
    setData(updated);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>

      {/* Confidence banner */}
      <section className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
        <span className="font-medium">
          Confidence assessment: {confidenceLabel}
        </span>
      </section>

      {/* Preview summary */}
      {(data.summary || data.conditionSummary) && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed space-y-1">
          <h2 className="font-semibold text-base mb-1">
            CarVerity analysis — preview
          </h2>
          {data.conditionSummary && <p>{data.conditionSummary}</p>}
          {data.summary && (
            <p className="text-xs opacity-70">
              (Free preview — the full scan provides a deeper,
              listing-specific breakdown.)
            </p>
          )}
        </section>
      )}

      {/* Vehicle details */}
      <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm">
        <h2 className="font-semibold text-base mb-2">Vehicle details</h2>
        <dl className="grid grid-cols-2 gap-y-1">
          <div>
            <dt className="text-muted-foreground">Make:</dt>
            <dd>{vehicle.make ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Model:</dt>
            <dd>{vehicle.model ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Year:</dt>
            <dd>{vehicle.year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Variant:</dt>
            <dd>{vehicle.variant ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kilometres:</dt>
            <dd>{kilometresDisplay}</dd>
          </div>
        </dl>
      </section>

      {/* Full AI analysis — blurred when locked */}
      <section className="relative rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed overflow-hidden">
        <h2 className="font-semibold text-base mb-3">Full AI analysis</h2>

        <div className={data.isUnlocked ? "space-y-4" : "space-y-4 blur-sm"}>
          {hasSections ? (
            data.sections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="font-semibold text-sm">{section.title}</h3>
                <p>{section.content}</p>
              </div>
            ))
          ) : (
            <p>{data.fullText || data.summary || "No analysis available."}</p>
          )}
        </div>

        {!data.isUnlocked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Full scan locked — unlock to reveal detailed risk signals,
                tailored buyer checks and negotiation insights for this listing.
              </p>
              <button
                type="button"
                onClick={handleUnlock}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
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
