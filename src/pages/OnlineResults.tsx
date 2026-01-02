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

    // Returned from checkout → permanently unlock (no credit deduction)
    if (unlocked && !stored.isUnlocked) {
      const updated: SavedResult = {
        ...stored,
        type: "online",
        isUnlocked: true,
        step: stored.step || "/online/results",
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

  const fullSummary =
    (result.summary?.trim() || result.conditionSummary?.trim()) ||
    "No AI summary was returned for this listing.";

  // --- Preview version (intentionally lighter) ---
  const previewSummary =
    "The listing suggests the vehicle presents well overall, with generally positive details so far. The full scan explores what this means for you in more depth — including risks, negotiation angles and what to double-check in person.";

  // --------------------------------
  // Confidence display mapping + guided next step
  // --------------------------------
  function getConfidenceDisplay() {
    switch (confidenceCode) {
      case "LOW":
        return {
          label: "Low — comfortable so far",
          colour: "bg-emerald-600",
          meaning:
            "Nothing concerning stands out so far. It still makes sense to confirm basic details, but this listing generally feels reassuring based on the available information.",
          nextStep:
            "If the car suits your needs, an in-person CarVerity scan is a good way to confirm condition and paperwork before moving ahead.",
        };
      case "MODERATE":
        return {
          label: "Moderate — a few things to confirm",
          colour: "bg-amber-500",
          meaning:
            "The listing looks mostly fine, but a few details are worth checking in person before progressing further. Clarifying these points will help you feel confident about your decision.",
          nextStep:
            "We recommend booking a CarVerity in-person scan to verify condition and confirm the details that aren’t fully clear from the listing alone.",
        };
      case "HIGH":
        return {
          label: "High — confirm important details first",
          colour: "bg-red-600",
          meaning:
            "Some details in this listing should be confirmed before treating it as a strong purchase candidate. This doesn’t mean the car is unsuitable — only that extra care is sensible.",
          nextStep:
            "Before progressing, arrange a CarVerity in-person scan and seek clarity on the key unknowns so you can make a confident, well-informed decision.",
        };
      default:
        return {
          label: "Not assessed",
          colour: "bg-slate-400",
          meaning:
            "Confidence could not be determined from the AI response for this listing.",
          nextStep:
            "If you’re interested in this vehicle, an in-person CarVerity scan is still the best next step to confirm condition and paperwork.",
        };
    }
  }

  const confidence = getConfidenceDisplay();

  // --------------------------------
  // Missing / unclear info
  // --------------------------------
  const missing: string[] = [];

  if (!vehicle.kilometres && !result.kilometres)
    missing.push("Kilometres not clearly stated");

  if (!vehicle.variant)
    missing.push("Variant not specified");

  if (!vehicle.importStatus)
    missing.push("Import / compliance status not listed");

  if (!result.photos?.listing?.length)
    missing.push(
      "Listing photos were not captured by the scan (this does not mean the seller did not include them)"
    );

  // --------------------------------
  // Flow actions
  // --------------------------------
  function handleContinue() {
    if (!result) return;

    const updated: SavedResult = {
      ...result,
      type: "online",
      step: "/online/next-actions",
      createdAt: result.createdAt || new Date().toISOString(),
      conditionSummary: result.conditionSummary || fullSummary,
    };

    saveOnlineResults(updated);
    setResult(updated);
    navigate("/online/next-actions", { replace: true });
  }

  // Permanently unlock using an existing credit
  function unlockWithCredit(): boolean {
    if (!result) return false;
    if (result.isUnlocked) return true;

    const attempt = useOneCredit();
    if (!attempt.ok) return false;

    const updated: SavedResult = {
      ...result,
      type: "online",
      isUnlocked: true,
      step: result.step || "/online/results",
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

  // --------------------------------
  // Blurred gated block wrapper
  // --------------------------------
  function BlurredPanel(props: { title: string; children: ReactNode }) {
    return (
      <div className="border rounded-lg relative overflow-hidden">
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <p className="font-semibold mb-1">Full scan locked</p>
            <p className="text-sm text-muted-foreground mb-3">
              Unlock to reveal risk signals, tailored buyer checks and negotiation insights for this listing.
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

  // --------------------------------
  // Render
  // --------------------------------
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

      {/* NEXT STEP BLOCK */}
      <div className="border rounded-lg p-4 bg-blue-50/5">
        <h2 className="font-semibold mb-2">Recommended next step</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {confidence.nextStep}
        </p>
      </div>

      {/* PREVIEW SUMMARY */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">CarVerity analysis — preview</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {isUnlocked ? fullSummary : previewSummary}
          {!isUnlocked &&
            "\n\n(Free preview — the full scan provides a deeper listing-specific breakdown.)"}
        </p>
      </div>

      {/* VEHICLE DETAILS */}
      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Vehicle details</h2>
        <p>Make: {vehicle.make ?? "—"}</p>
        <p>Model: {vehicle.model ?? "—"}</p>
        <p>Year: {vehicle.year ?? "—"}</p>
        <p>Variant: {vehicle.variant ?? "—"}</p>
        <p>
          Import status: {vehicle.importStatus ?? "Sold new in Australia (default)"}
        </p>
        <p>
          Kilometres: {vehicle.kilometres ?? result.kilometres ?? "Not specified"}
        </p>
      </div>

      {/* MISSING DETAILS */}
      {missing.length > 0 && (
        <div className="border rounded-lg p-4 bg-amber-50/10">
          <h2 className="font-semibold mb-2">Missing or unclear details</h2>
          <ul className="list-disc ml-5 text-muted-foreground">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* GATED SECTIONS */}
      <BlurredPanel title="Key risk signals">
        <p className="text-muted-foreground whitespace-pre-line">
          {fullSummary}
        </p>
      </BlurredPanel>

      <BlurredPanel title="Buyer considerations">
        <p className="text-muted-foreground whitespace-pre-line">
          {fullSummary}
        </p>
      </BlurredPanel>

      <BlurredPanel title="Negotiation insights">
        <p className="text-muted-foreground whitespace-pre-line">
          {fullSummary}
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
