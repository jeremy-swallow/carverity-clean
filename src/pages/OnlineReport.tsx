import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";
import type { SavedResult } from "../utils/onlineResults";

export default function OnlineReport() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored ?? null);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No report available</h1>
        <p className="text-muted-foreground">
          Run a scan first to generate a report.
        </p>
      </div>
    );
  }

  // 🟢 SAFE NORMALISED ARRAYS
  const signals = Array.isArray(result.signals) ? result.signals : [];
  const sections = Array.isArray(result.sections) ? result.sections : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Scan report</h1>

      <p className="text-sm mb-4 text-muted-foreground break-all">
        Listing URL:
        <br />
        {result.listingUrl || "—"}
      </p>

      {/* Signals */}
      <div className="mb-6 p-4 border border-white/10 rounded bg-black/20">
        <h2 className="font-medium mb-2">Signals detected</h2>

        {signals.length > 0 ? (
          <ul className="list-disc pl-4">
            {signals.map((s, i) => (
              <li key={i}>{String(s)}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No signals recorded for this scan.
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">Analysis sections</h2>

        {sections.length > 0 ? (
          sections.map((sec, i) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-3"
            >
              <h3 className="font-semibold mb-1">
                {sec?.title || "Untitled section"}
              </h3>
              <p className="text-muted-foreground">
                {sec?.content || ""}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No additional analysis sections available.
          </p>
        )}
      </div>
    </div>
  );
}
