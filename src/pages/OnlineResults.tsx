// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) {
      setResult(stored);
      setShowFull(Boolean(stored.isUnlocked));
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan found</h1>
        <p className="text-muted-foreground">
          Run a scan to view results here.
        </p>
      </div>
    );
  }

  const confidence =
    result.confidenceCode?.toUpperCase() ?? "Not available";

  const vehicle = result.vehicle ?? {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

      {/* Listing confidence */}
      <section className="border border-white/10 rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </p>
        <p className="font-medium">
          {confidence} — listing confidence
        </p>
      </section>

      {/* Preview */}
      <section className="border border-white/10 rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">
          CarVerity analysis — preview
        </p>
        <p className="text-sm leading-relaxed">
          {result.previewSummary ?? "No preview available."}
        </p>
      </section>

      {/* Locked full report */}
      {!showFull && (
        <section className="border border-white/10 rounded-xl p-4">
          <p className="text-sm font-medium mb-1">
            This is your full CarVerity report, including detailed guidance on what to look for in person.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            In the live app this area will unlock with a paid scan. For now, you can reveal it here while testing.
          </p>

          <div className="flex justify-center">
            <button
              onClick={() => setShowFull(true)}
              className="px-4 py-2 rounded-lg border border-white/20 text-sm hover:bg-white/10 transition"
            >
              View full scan (testing)
            </button>
          </div>
        </section>
      )}

      {/* Unlocked sectioned report */}
      {showFull && result.sections?.map((s, i) => (
        <section key={i} className="border border-white/10 rounded-xl p-4">
          <p className="text-sm font-medium mb-2">{s.title}</p>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {s.content}
          </pre>
        </section>
      ))}

      {/* Vehicle details */}
      <section className="border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-y-2 text-sm">
        <div>
          <p className="text-muted-foreground">Make</p>
          <p>{vehicle.make || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Model</p>
          <p>{vehicle.model || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Year</p>
          <p>{vehicle.year || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Kilometres</p>
          <p>{vehicle.kilometres || "—"}</p>
        </div>
      </section>
    </div>
  );
}
