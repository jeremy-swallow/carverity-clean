import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return setResult(null);

    // ✅ If user returned from checkout with success flag → unlock report
    const unlocked = params.get("unlocked") === "true";

    if (unlocked && !stored.isUnlocked) {
      const updated: SavedResult = { ...stored, isUnlocked: true };
      saveOnlineResults(updated);
      setResult(updated);
      return;
    }

    setResult(stored);
  }, [params]);

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
  const isUnlocked = result.isUnlocked ?? false;
  const confidenceCode = (result as any).confidenceCode?.toUpperCase?.() ?? null;

  const summary =
    (result.summary?.trim() || result.conditionSummary?.trim()) ||
    "No AI summary was returned for this listing — but the details below were successfully extracted.";

  // -------------------------------
  // Confidence display
  // -------------------------------
  function getConfidenceDisplay() {
    switch (confidenceCode) {
      case "LOW":
        return {
          label: "Low — comfortable so far",
          colour: "bg-emerald-600",
          meaning:
            "This listing appears generally positive based on the available information. It still makes sense to confirm key details, but nothing concerning stands out so far.",
        };
      case "MODERATE":
        return {
          label: "Moderate — a few things to confirm",
          colour: "bg-amber-500",
          meaning:
            "This listing looks mostly fine, but a couple of details are worth confirming in person before moving ahead. Clarifying these points will help you feel confident about the next step.",
        };
      case "HIGH":
        return {
          label: "High — confirm important details first",
          colour: "bg-red-600",
          meaning:
            "This listing includes details that should be confirmed before progressing further. It may still be suitable — but checking the unclear points will help you avoid surprises.",
        };
      default:
        return {
          label: "Not assessed",
          colour: "bg-slate-400",
          meaning:
            "Confidence could not be determined from the AI response for this listing.",
        };
    }
  }

  const confidence = getConfidenceDisplay();

  // -------------------------------
  // Missing details
  // -------------------------------
  const missing: string[] = [];
  if (!vehicle.kilometres && !result.kilometres)
    missing.push("Kilometres not clearly stated");
  if (!vehicle.variant) missing.push("Variant not specified");
  if (!vehicle.importStatus)
    missing.push("Import / compliance status not listed");
  if (!result.photos?.listing?.length)
    missing.push(
      "Listing photos were not captured by the scan (this does not mean the seller did not include them)"
    );

  // -------------------------------
  // Flow actions
  // -------------------------------
  function handleContinue() {
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      step: "/online/next-actions",
      conditionSummary: result.conditionSummary ?? summary,
    };

    saveOnlineResults(updated);
    setResult(updated);
    navigate("/online/next-actions", { replace: true });
  }

  function handleUnlock() {
    // 🔹 We pass return location + scan context to checkout
    const returnUrl = encodeURIComponent("/online/results?unlocked=true");

    navigate(
      `/checkout?mode=online-scan&return=${returnUrl}`,
      { replace: false }
    );
  }

  // -------------------------------
  // Blurred gated block wrapper
  // -------------------------------
  function BlurredPanel(props: { title: string; children: React.ReactNode }) {
    return (
      <div className="border rounded-lg relative overflow-hidden">
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <p className="font-semibold mb-1">Full report locked</p>
            <p className="text-sm text-muted-foreground mb-3">
              Unlock to view risk signals, negotiation insights and in-person inspection guidance.
            </p>
            <button
              onClick={handleUnlock}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              Unlock full scan
            </button>
          </div>
        )}
        <div className={`p-4 ${!isUnlocked ? "opacity-40 select-none" : ""}`}>
          <h2 className="font-semibold mb-2">{props.title}</h2>
          {props.children}
        </div>
      </div>
    );
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

      {/* CONFIDENCE */}
      <div className="border rounded-lg p-4 flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${confidence.colour}`} />
        <p className="font-medium">
          Confidence assessment: {confidence.label}
        </p>
      </div>

      {/* WHAT THIS MEANS */}
      <div className="border rounded-lg p-4 bg-white/5">
        <h2 className="font-semibold mb-2">What this means for you</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {confidence.meaning}
        </p>
      </div>

      {/* FREE PREVIEW – PARTIAL SUMMARY */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">CarVerity analysis — preview</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {summary.split("\n").slice(0, 4).join("\n")}
          {isUnlocked ? "" : "\n\n(Preview only — full analysis available after unlock)"}
        </p>
      </div>

      {/* VEHICLE DETAILS — ALWAYS VISIBLE */}
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
          Kilometres: {vehicle.kilometres ?? result.kilometres ?? "Not specified"}
        </p>
      </div>

      {/* MISSING DETAILS — ALWAYS VISIBLE */}
      {missing.length > 0 && (
        <div className="border rounded-lg p-4 bg-amber-50/10">
          <h2 className="font-semibold mb-2">Missing or unclear details</h2>
          <ul className="list-disc ml-5 text-muted-foreground">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <p className="text-sm mt-2 text-muted-foreground">
            Missing information isn’t always a problem — but these points are worth confirming before moving ahead.
          </p>
        </div>
      )}

      {/* GATED SECTIONS */}
      <BlurredPanel title="Key risk signals">
        <p className="text-muted-foreground whitespace-pre-line">
          {summary}
        </p>
      </BlurredPanel>

      <BlurredPanel title="Buyer considerations">
        <p className="text-muted-foreground whitespace-pre-line">
          {summary}
        </p>
      </BlurredPanel>

      <BlurredPanel title="Negotiation insights">
        <p className="text-muted-foreground whitespace-pre-line">
          {summary}
        </p>
      </BlurredPanel>

      {sections.length > 0 && (
        <BlurredPanel title="Additional analysis">
          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {s.content}
                </p>
              </div>
            ))}
          </div>
        </BlurredPanel>
      )}

      {/* CONTINUE CTA */}
      {isUnlocked && (
        <div className="pt-4">
          <button
            onClick={handleContinue}
            className="bg-blue-600 text-white px-5 py-2 rounded shadow"
          >
            Continue — review next recommended steps
          </button>
        </div>
      )}
    </div>
  );
}
