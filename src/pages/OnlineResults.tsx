import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(
    loadOnlineResults()
  );

  useEffect(() => {
    setResult(loadOnlineResults());
  }, []);

  // 🚫 No stored scan — show fallback
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan to view AI-assisted results.
        </p>
      </div>
    );
  }

  const locked = !result.isUnlocked;

  function unlockResults() {
    // If something went wrong and there's no result, do nothing
    if (!result) return;

    // ✅ guarantee required fields + preserve literal type
    const updated: SavedResult = {
      ...result,
      type: "online",
      step: result.step ?? "/online/results",
      createdAt: result.createdAt ?? new Date().toISOString(),
      listingUrl: result.listingUrl ?? "",
      vehicle: result.vehicle ?? {},
      sections: result.sections ?? [],
      isUnlocked: true,
    };

    saveOnlineResults(updated);
    setResult(updated);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">
        Scan results — AI-assisted review
      </h1>

      <p className="text-sm mb-6">
        Listing analysed:&nbsp;
        <a
          href={result.listingUrl || "#"}
          className="underline"
          target="_blank"
        >
          {result.listingUrl || "Unknown listing"}
        </a>
      </p>

      {/* SUMMARY */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 mb-6">
        <h2 className="font-medium mb-1">CarVerity review summary</h2>

        <p className={locked ? "blur-sm select-none" : ""}>
          {result.summary || "No summary returned."}
        </p>

        {locked && (
          <button
            onClick={unlockResults}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Unlock full report — $3.99
          </button>
        )}
      </div>

      {/* VEHICLE DETAILS */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 mb-6">
        <h2 className="font-medium mb-1">Vehicle details</h2>

        <div className={locked ? "blur-sm select-none" : ""}>
          <p>Make: {result.vehicle?.make ?? "—"}</p>
          <p>Model: {result.vehicle?.model ?? "—"}</p>
          <p>Year: {result.vehicle?.year ?? "—"}</p>
          <p>Variant: {result.vehicle?.variant ?? "—"}</p>
          <p>
            Import status:{" "}
            {result.vehicle?.importStatus ?? "Not specified in listing"}
          </p>
        </div>
      </div>

      {/* SECTIONS */}
      {result.sections && result.sections.length > 0 ? (
        result.sections.map((s, i) => (
          <div
            key={i}
            className={
              "bg-slate-800/60 border border-white/10 rounded-xl p-4 mb-4 " +
              (locked ? "blur-sm select-none" : "")
            }
          >
            <h3 className="font-medium mb-1">{s.title}</h3>
            <p className="text-sm whitespace-pre-line">{s.content}</p>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">
          No additional sections returned.
        </p>
      )}
    </div>
  );
}
