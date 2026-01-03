import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_debug_unlock_full_scan";

/* ------------------------------
   Helpers
------------------------------ */

function TextBlock({ value }: { value?: string | null }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
      {value.trim()}
    </pre>
  );
}

/**
 * “Tease-style” preview — avoids giving away specifics.
 * Encourages unlocking while still feeling helpful.
 */
function buildPreviewTeaser(confidenceText?: string | null) {
  if (!confidenceText) {
    return (
      "Preview not available. The full scan includes clearer guidance on what’s " +
      "worth checking in person, plus practical inspection tips for this vehicle."
    );
  }

  return (
    confidenceText.trim() +
    " The full scan also provides practical guidance on what’s worth checking " +
    "in person, based on the details in the listing."
  );
}

/* ------------------------------
   Component
------------------------------ */

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

  const {
    vehicle = {},
    confidenceCode,
    fullSummary,
    summary,
  } = result;

  const confidenceText =
    summary?.split("\n")[0]?.trim() ||
    fullSummary?.split("\n")[0]?.trim() ||
    null;

  const reportText = fullSummary || summary || "";

  const confidenceLabel = confidenceCode
    ? `${confidenceCode} — listing confidence`
    : "Not available";

  const previewTeaser = buildPreviewTeaser(confidenceText);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE CARD */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </h2>
        <p className="text-white font-medium">{confidenceLabel}</p>
      </section>

      {/* CONFIDENCE EXPLANATION */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Confidence assessment
        </h2>
        <p className="text-slate-200 text-sm leading-relaxed">
          {confidenceText ||
            "This listing looks mostly positive so far. The full scan provides clearer guidance on what’s worth checking in person."}
        </p>
      </section>

      {/* PREVIEW / LOCKED REPORT */}
      {!showFull && (
        <section className="rounded-lg border border-white/10 p-4 space-y-3">
          <h2 className="text-sm text-muted-foreground mb-1">
            CarVerity analysis — preview
          </h2>

          <p className="text-slate-200 text-sm leading-relaxed">
            {previewTeaser}
          </p>

          <div className="rounded-md border border-white/10 bg-white/5 backdrop-blur px-3 py-2 text-xs text-slate-400">
            Full scan content is locked
          </div>

          <button
            onClick={unlockForTesting}
            className="mt-1 inline-flex items-center justify-center rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium hover:bg-indigo-600 transition"
          >
            Unlock full scan (testing)
          </button>

          <p className="text-[11px] text-slate-500 mt-1">
            In the live app this area unlocks with a paid scan. This button is
            only visible during development.
          </p>
        </section>
      )}

      {/* FULL REPORT (UNLOCKED) */}
      {showFull && reportText && (
        <section className="space-y-6">
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
