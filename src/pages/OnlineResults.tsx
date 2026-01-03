// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { loadOnlineResults, type SavedResult } from "../utils/onlineResults";

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

const UNLOCK_KEY = "carverity_full_report_unlocked";

function buildNaturalPreview(text?: string | null) {
  if (!text) return null;

  const confidence = text.match(
    /CONFIDENCE ASSESSMENT[\r\n]+([\s\S]*?)(?=\n{2,}|$)/i
  );
  if (confidence?.[1]) {
    return confidence[1]
      .trim()
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ");
  }

  return (
    text
      .split("\n")
      .filter(Boolean)[0]
      ?.trim() ?? null
  );
}

function TextBlock({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
      {value.trim()}
    </pre>
  );
}

/* -------------------------------------------------------
   Component
------------------------------------------------------- */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;

    setResult(stored);

    const persistedUnlock =
      stored.isUnlocked || localStorage.getItem(UNLOCK_KEY) === "1";

    setShowFull(Boolean(persistedUnlock));
  }, []);

  function unlockReportForTesting() {
    setShowFull(true);
    localStorage.setItem(UNLOCK_KEY, "1");
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-muted-foreground">
          Run a scan to view your CarVerity results.
        </p>
      </div>
    );
  }

  const confidence =
    result.confidenceCode?.toUpperCase() || "Not available";

  const vehicle = result.vehicle ?? {};

  const reportText = result.fullSummary || result.summary || "";
  const preview =
    result.previewSummary || buildNaturalPreview(reportText);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </h2>
        <p className="text-white font-medium">
          {confidence
            ? `${confidence} — listing confidence`
            : "Not available"}
        </p>
      </section>

      {/* PREVIEW */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </h2>

        {!preview && (
          <p className="text-muted-foreground">
            No preview available.
          </p>
        )}

        {preview && (
          <p className="text-slate-200 text-sm leading-relaxed">
            {preview}…{" "}
            <span className="text-indigo-400">
              Unlock full scan to see the complete report.
            </span>
          </p>
        )}
      </section>

      {/* LOCKED FULL REPORT */}
      {!showFull && (
        <section className="rounded-lg border border-white/10 p-4 backdrop-blur-sm bg-white/5">
          <p className="text-slate-300 text-sm mb-3">
            This is your full CarVerity report, including detailed
            guidance on what to look for in person.
            <br />
            In the live app this area will unlock with a paid scan.
            For now, you can reveal it here while testing.
          </p>

          <button
            onClick={unlockReportForTesting}
            className="px-4 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10 transition"
          >
            View full scan (testing)
          </button>
        </section>
      )}

      {/* FULL REPORT CONTENT */}
      {showFull && reportText && (
        <section className="space-y-6 rounded-lg border border-white/10 p-4">
          <TextBlock value={reportText} />
        </section>
      )}

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
