import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored ?? null);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground mb-6">
          Run a scan to view AI-assisted results.
        </p>
      </div>
    );
  }

  const vehicle = result.vehicle ?? {};
  const sections = result.sections ?? [];

  const summary =
    (result.summary?.trim() || result.conditionSummary?.trim()) ||
    "No AI summary was returned for this listing — but the details below were successfully extracted.";

  // -------------------------------
  // Confidence / Risk Heuristic
  // -------------------------------
  function assessConfidence() {
    const text = summary.toLowerCase();

    if (text.includes("significant") || text.includes("major") || text.includes("high risk")) {
      return { level: "high" as const, label: "High Risk", colour: "bg-red-600" };
    }

    if (
      text.includes("clarify") ||
      text.includes("unclear") ||
      text.includes("requires confirmation")
    ) {
      return { level: "medium" as const, label: "Moderate Risk", colour: "bg-amber-500" };
    }

    return { level: "low" as const, label: "Low Risk", colour: "bg-emerald-600" };
  }

  const confidence = assessConfidence();

  // -------------------------------
  // Missing / Unclear Details
  // -------------------------------
  const missing: string[] = [];

  if (!vehicle.kilometres && !result.kilometres) {
    missing.push("Kilometres not clearly stated");
  }
  if (!vehicle.variant) missing.push("Variant not specified");
  if (!vehicle.importStatus) missing.push("Import / compliance status not listed");
  if (!result.photos?.listing?.length) missing.push("No listing photos extracted");

  // -------------------------------
  // Continue → next actions
  // -------------------------------
  function handleContinue() {
    // Extra guard for TypeScript + runtime safety
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      type: "online",
      step: "/online/next-actions",
      createdAt: result.createdAt ?? new Date().toISOString(),
      listingUrl: result.listingUrl ?? "",
      vehicle: result.vehicle ?? {},
      sections: result.sections ?? [],
      photos: result.photos ?? { listing: [], meta: [] },
      conditionSummary: result.conditionSummary ?? summary,
      summary: result.summary ?? summary,
      kilometres: result.kilometres ?? null,
      isUnlocked: result.isUnlocked ?? true,
    };

    saveOnlineResults(updated);
    setResult(updated);
    navigate("/online/next-actions", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="text-2xl font-semibold">Scan results — AI-assisted review</h1>

      <p className="text-sm">
        Listing analysed:{" "}
        <a
          href={result.listingUrl || "#"}
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          {result.listingUrl || "Unknown source"}
        </a>
      </p>

      {/* CONFIDENCE BADGE */}
      <div className="border rounded-lg p-4 flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${confidence.colour}`}></span>
        <p className="font-medium">
          Confidence assessment: {confidence.label}
        </p>
      </div>

      {/* WHAT THIS MEANS */}
      <div className="border rounded-lg p-4 bg-white/5">
        <h2 className="font-semibold mb-2">What this means for you</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {confidence.level === "low" &&
            "This listing appears generally positive based on the available information. It still makes sense to confirm key details, but there are no strong risk signals at first glance."}

          {confidence.level === "medium" &&
            "This listing looks potentially suitable, but a few details are unclear and should be confirmed before progressing further. Clarifying these points will help you avoid surprises later."}

          {confidence.level === "high" &&
            "This listing contains details that could affect confidence in the purchase. It may still be worth considering — but only after confirming missing or uncertain information and carefully reviewing condition and history."}
        </p>
      </div>

      {/* SUMMARY PANEL */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">CarVerity analysis</h2>
        <p className="text-muted-foreground whitespace-pre-line">{summary}</p>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <p>Make: {vehicle.make ?? "—"}</p>
        <p>Model: {vehicle.model ?? "—"}</p>
        <p>Year: {vehicle.year ?? "—"}</p>
        <p>Variant: {vehicle.variant ?? "—"}</p>
        <p>
          Import status:{" "}
          {vehicle.importStatus ?? "Sold new in Australia (default)"}
        </p>
        <p>
          Kilometres:{" "}
          {vehicle.kilometres ??
            result.kilometres ??
            "Not specified"}
        </p>
      </div>

      {/* MISSING / UNCLEAR */}
      {missing.length > 0 && (
        <div className="border rounded-lg p-4 bg-amber-50/10">
          <h2 className="font-semibold mb-2">Missing or unclear details</h2>
          <ul className="list-disc ml-5 text-muted-foreground">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <p className="text-sm mt-2 text-muted-foreground">
            Missing information isn’t always a problem — but it means{" "}
            <strong>these points are worth confirming</strong> before moving ahead.
          </p>
        </div>
      )}

      {/* EXTRA AI SECTIONS (if any) */}
      {sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {s.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CONTINUE CTA */}
      <div className="pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-5 py-2 rounded shadow"
        >
          Continue — review next recommended steps
        </button>
      </div>
    </div>
  );
}
