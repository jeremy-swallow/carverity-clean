import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { loadCredits, useOneCredit } from "../utils/scanCredits";

export default function OnlineResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [result, setResult] = useState<SavedResult | null>(null);

  // --------------------------------
  // Load + unlock-on-return
  // --------------------------------
  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) {
      setResult(null);
      return;
    }

    const unlocked = params.get("unlocked") === "true";

    // Returned from checkout → permanently unlock
    if (unlocked && !stored.isUnlocked) {
      const updated: SavedResult = {
        ...stored,
        type: "online",
        isUnlocked: true,
        step: "/online/results",
        createdAt: stored.createdAt || new Date().toISOString(),
      };

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
        <p className="text-muted-foreground">
          Run a scan to view AI-assisted results.
        </p>
      </div>
    );
  }

  const vehicle = result.vehicle ?? {};
  const isUnlocked = result.isUnlocked ?? false;
  const sections = result.sections ?? [];

  const confidenceCode =
    (result as any).confidenceCode?.toUpperCase?.() ?? null;

  const summaryPreview =
    result.summary?.split("\n")[0] ||
    "The listing appears generally positive so far, but a few details are worth confirming in person.";

  const fullSummary =
    result.summary?.trim() ||
    result.conditionSummary?.trim() ||
    "";

  // --------------------------------
  // Confidence mapping
  // --------------------------------
  function getConfidenceDisplay() {
    switch (confidenceCode) {
      case "LOW":
        return {
          label: "Low — comfortable so far",
          colour: "bg-emerald-600",
          meaning:
            "This listing appears positive overall with no major concerns so far. It still makes sense to confirm key details in person.",
          next: "Proceed if you’re interested — but a quick in-person scan is recommended before committing.",
        };
      case "MODERATE":
        return {
          label: "Moderate — a few things to confirm",
          colour: "bg-amber-500",
          meaning:
            "The listing looks mostly fine, but a couple of details are worth checking in person before progressing further.",
          next: "We recommend booking a CarVerity in-person scan to confirm condition and paperwork.",
        };
      case "HIGH":
        return {
          label: "High — confirm important details first",
          colour: "bg-red-600",
          meaning:
            "This listing includes details that should be confirmed before progressing further.",
          next: "Do not proceed without an in-person scan — key details need verification.",
        };
      default:
        return {
          label: "Not assessed",
          colour: "bg-slate-400",
          meaning:
            "Confidence could not be determined from the AI response for this listing.",
          next: "We recommend confirming details in person before making a decision.",
        };
    }
  }

  const confidence = getConfidenceDisplay();

  // --------------------------------
  // Unlock behaviour
  // --------------------------------
  function unlockWithCredit(): boolean {
    if (!result) return false;
    if (result.isUnlocked) return true; // never double-spend

    const attempt = useOneCredit();
    if (!attempt.ok) return false;

    const updated: SavedResult = {
      ...result,
      isUnlocked: true,
      step: "/online/results",
      createdAt: result.createdAt || new Date().toISOString(),
    };

    saveOnlineResults(updated);
    setResult(updated);
    return true;
  }

  function handleUnlock() {
    if (!result) return;
    const credits = loadCredits();

    if (credits > 0) {
      const ok = unlockWithCredit();
      if (ok) return;
    }

    const returnUrl = encodeURIComponent("/online/results?unlocked=true");
    navigate(`/checkout?mode=online-scan&return=${returnUrl}`);
  }

  function handleContinue() {
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      step: "/online/next-actions",
      conditionSummary: result.conditionSummary || fullSummary,
    };

    saveOnlineResults(updated);
    navigate("/online/next-actions", { replace: true });
  }

  // --------------------------------
  // Gated panel wrapper
  // --------------------------------
  function BlurredPanel(props: { title: string; children: ReactNode }) {
    return (
      <div className="border rounded-lg relative overflow-hidden">
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6 pointer-events-none">
            <p className="font-semibold mb-1">Full scan locked</p>
            <p className="text-sm text-muted-foreground mb-3">
              Unlock to reveal risk signals, buyer checks and negotiation insights.
            </p>
            <button
              onClick={handleUnlock}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow pointer-events-auto"
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

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="text-2xl font-semibold">Scan results — AI-assisted review</h1>

      <p className="text-sm">
        Listing analysed:{" "}
        <a href={result.listingUrl || "#"} className="underline" target="_blank" rel="noreferrer">
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

      {/* NEXT STEP GUIDANCE */}
      <div className="border rounded-lg p-4 bg-white/5">
        <h2 className="font-semibold mb-2">Recommended next step</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {confidence.next}
        </p>
      </div>

      {/* PREVIEW SUMMARY */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">CarVerity analysis — preview</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {summaryPreview}
          {!isUnlocked && "\n\n(Free preview — the full scan provides a deeper listing-specific breakdown.)"}
        </p>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Vehicle details</h2>
        <p>Make: {vehicle.make ?? "—"}</p>
        <p>Model: {vehicle.model ?? "—"}</p>
        <p>Year: {vehicle.year ?? "—"}</p>
        <p>Variant: {vehicle.variant ?? "—"}</p>
        <p>Import status: {vehicle.importStatus ?? "Sold new in Australia (default)"}</p>
        <p>Kilometres: {vehicle.kilometres ?? result.kilometres ?? "Not specified"}</p>
      </div>

      {/* FULL CONTENT — LOCKED */}
      <BlurredPanel title="Key risk signals">
        <p className="text-muted-foreground whitespace-pre-line">{fullSummary}</p>
      </BlurredPanel>

      <BlurredPanel title="Buyer considerations">
        <p className="text-muted-foreground whitespace-pre-line">{fullSummary}</p>
      </BlurredPanel>

      <BlurredPanel title="Negotiation insights">
        <p className="text-muted-foreground whitespace-pre-line">{fullSummary}</p>
      </BlurredPanel>

      {!!sections.length && (
        <BlurredPanel title="Additional analysis">
          <div className="space-y-4">
            {sections.map((s, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-muted-foreground whitespace-pre-line">{s.content}</p>
              </div>
            ))}
          </div>
        </BlurredPanel>
      )}

      {/* CONTINUE CTA */}
      {isUnlocked && (
        <div className="pt-2">
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
