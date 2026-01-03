// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
  normaliseVehicle,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_unlock_fullscan";

function TextBlock({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
      {value.trim()}
    </pre>
  );
}

/**
 * Create a reliable preview from either:
 * - previewSummary (preferred), or
 * - the first 2–3 sentences of the full report
 */
function buildPreview(result: SavedResult): string | null {
  if (result.previewSummary) {
    return result.previewSummary.trim();
  }

  const text = result.fullSummary || result.summary || "";
  if (!text) return null;

  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .slice(0, 3)
    .join(" ")
    .trim();

  return sentences || null;
}

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

  function unlockForTesting() {
    setShowFull(true);
    localStorage.setItem(UNLOCK_KEY, "1");
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

  const confidence =
    result.confidenceCode?.toUpperCase() || "Not available";

  const vehicle = normaliseVehicle(result.vehicle || {});
  const preview = buildPreview(result);
  const fullText = result.fullSummary || result.summary || "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Confidence assessment
        </h2>
        <p className="text-white font-medium">
          {confidence === "NOT AVAILABLE"
            ? "Not available"
            : `${confidence} — listing confidence`}
        </p>
      </section>

      {/* PREVIEW */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </h2>

        {!preview && (
          <p className="text-muted-foreground text-sm">
            Preview not available.
            <br />
            The full scan provides more context about what’s worth checking in
            person when you see the car.
          </p>
        )}

        {preview && !showFull && (
          <>
            <p className="text-slate-200 text-sm leading-relaxed">
              {preview}…{" "}
              <span className="text-indigo-400">
                Unlock full scan to see the complete report.
              </span>
            </p>

            <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Full scan content is locked
              </p>

              <button
                onClick={unlockForTesting}
                className="px-3 py-1.5 text-xs rounded-md bg-indigo-500 hover:bg-indigo-600"
              >
                Unlock full scan (testing)
              </button>
            </div>
          </>
        )}
      </section>

      {/* FULL REPORT */}
      {showFull && fullText && (
        <section className="rounded-lg border border-white/10 p-4 space-y-4">
          <TextBlock value={fullText} />
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
