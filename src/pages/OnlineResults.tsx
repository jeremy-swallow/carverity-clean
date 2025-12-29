// src/pages/OnlineResults.tsx

import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  unlockOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { saveProgress } from "../utils/scanProgress";
import { useNavigate } from "react-router-dom";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = loadOnlineResults();

    if (!raw || typeof raw !== "object") {
      setResult(null);
      return;
    }

    const stored: SavedResult = {
      createdAt: raw.createdAt ?? "",
      source: raw.source ?? "online",
      sellerType: raw.sellerType ?? "unknown",
      listingUrl: raw.listingUrl ?? "",
      summary: raw.summary ?? "",
      signals: Array.isArray(raw.signals) ? raw.signals : [],
      sections: Array.isArray(raw.sections) ? raw.sections : [],
      analysisSource: raw.analysisSource,
      vehicle: raw.vehicle ?? {},
      conditionSummary: raw.conditionSummary,
      notes: raw.notes,
      isUnlocked: raw.isUnlocked ?? false,
    };

    setResult(stored);
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
  }

  function startInPersonScan() {
    // Extra safety — never run if somehow result is missing
    if (!result) return;

    saveProgress({
      type: "in-person",
      step: "/scan/in-person/start",
      startedAt: new Date().toISOString(),
      listingUrl: result.listingUrl,
      vehicle: result.vehicle ?? {},
      fromOnlineScan: true,
    });

    navigate("/scan/in-person/start");
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

      {result.summary && (
        <div className="mb-6 border border-white/10 rounded-lg p-4">
          <h2 className="font-semibold mb-1">Overview</h2>
          <p className="text-muted-foreground">{result.summary}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key risk signals</h2>

        {result.signals.length > 0 ? (
          <ul className={`list-disc pl-4 ${locked ? "blur-sm" : ""}`}>
            {result.signals.map((s, i) => (
              <li key={i}>{s?.text ?? "Unnamed signal"}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No explicit risk signals detected in this listing.
          </p>
        )}
      </div>

      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Analysis details</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section, i) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-4"
            >
              <h3 className="font-medium mb-1">
                {section?.title ?? "Untitled section"}
              </h3>
              <p className="text-muted-foreground">
                {section?.content ?? ""}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No analysis sections returned.
          </p>
        )}
      </div>

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

      <div className="mt-10 p-4 border border-white/10 rounded-lg bg-black/20">
        <h3 className="font-semibold mb-1">Limitations of this report</h3>
        <p className="text-sm text-muted-foreground">
          This online scan is based on the information available in the listing
          and the details you provided. It is designed to highlight potential
          risk areas and help you decide whether the car is worth inspecting in
          person.
          <br />
          <br />
          For the most reliable outcome, we recommend continuing with an{" "}
          <strong>in-person CarVerity inspection</strong> and, where
          appropriate, seeking independent mechanical advice.
        </p>

        <div className="mt-4">
          <button
            onClick={startInPersonScan}
            className="px-4 py-2 rounded bg-emerald-400 text-black font-semibold"
          >
            Continue with in-person inspection →
          </button>
        </div>
      </div>
    </div>
  );
}
