import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

/**
 * Try to split the AI summary into logical sections based on the headings
 * we enforce in the Gemini prompt.
 */
function parseStructuredSummary(summary: string) {
  type Key =
    | "confidenceAssessment"
    | "whatThisMeans"
    | "analysisSummary"
    | "keyRiskSignals"
    | "buyerConsiderations"
    | "negotiationInsights";

  const map: Partial<Record<Key, string>> = {};

  const source = summary || "";
  if (!source) return map;

  const regex =
    /(CONFIDENCE ASSESSMENT|WHAT THIS MEANS FOR YOU|CARVERITY ANALYSIS — SUMMARY|KEY RISK SIGNALS|BUYER CONSIDERATIONS|NEGOTIATION INSIGHTS)/g;

  const matches: { header: string; start: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(source)) !== null) {
    matches.push({ header: m[1], start: m.index });
  }

  if (matches.length === 0) return map;

  const headerToKey: Record<string, Key> = {
    "CONFIDENCE ASSESSMENT": "confidenceAssessment",
    "WHAT THIS MEANS FOR YOU": "whatThisMeans",
    "CARVERITY ANALYSIS — SUMMARY": "analysisSummary",
    "KEY RISK SIGNALS": "keyRiskSignals",
    "BUYER CONSIDERATIONS": "buyerConsiderations",
    "NEGOTIATION INSIGHTS": "negotiationInsights",
  };

  for (let i = 0; i < matches.length; i++) {
    const { header, start } = matches[i];
    const end = i + 1 < matches.length ? matches[i + 1].start : source.length;
    const body = source
      .slice(start + header.length, end)
      .trim()
      .replace(/^\s*[:\-–]\s*/, "");
    const key = headerToKey[header];
    if (key) {
      map[key] = body;
    }
  }

  return map;
}

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // --------------------------------
  // Load saved online scan
  // --------------------------------
  useEffect(() => {
    const stored = loadOnlineResults();
    setResult(stored ?? null);
    setIsUnlocked(stored?.isUnlocked ?? false);
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
  const confidenceCode = (result as any).confidenceCode?.toUpperCase?.() ?? null;

  const summary =
    (result.summary?.trim() || result.conditionSummary?.trim()) ||
    "No AI summary was returned for this listing — but the details below were successfully extracted.";

  const parsed = parseStructuredSummary(summary);

  // --------------------------------
  // Confidence display mapping
  // --------------------------------
  function getConfidenceDisplay() {
    switch (confidenceCode) {
      case "LOW":
        return {
          label: "Low — comfortable so far",
          colour: "bg-emerald-600",
          meaning:
            parsed.whatThisMeans ||
            "This listing appears generally positive based on the available information. It still makes sense to confirm key details, but nothing concerning stands out so far.",
        };
      case "MODERATE":
        return {
          label: "Moderate — a few things to confirm",
          colour: "bg-amber-500",
          meaning:
            parsed.whatThisMeans ||
            "This listing looks mostly fine, but a couple of details are worth confirming in person before moving ahead. Clarifying these points will help you feel confident about the next step.",
        };
      case "HIGH":
        return {
          label: "High — confirm important details first",
          colour: "bg-red-600",
          meaning:
            parsed.whatThisMeans ||
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
    const current = result!;

    const updated: SavedResult = {
      ...current,
      type: "online",
      step: "/online/next-actions",
      createdAt: current.createdAt || new Date().toISOString(),
      conditionSummary: current.conditionSummary || summary,
      listingUrl: current.listingUrl ?? null,
      vehicle: current.vehicle ?? {},
      sections: current.sections ?? [],
      photos: current.photos ?? { listing: [], meta: [] },
      isUnlocked: true,
    };

    saveOnlineResults(updated);
    setResult(updated);
    setIsUnlocked(true);
    navigate("/online/next-actions", { replace: true });
  }

  // 🔓 TEMPORARY: unlock locally without payments / credits
  function handleUnlock() {
    const current = result!;

    const updated: SavedResult = {
      ...current,
      type: "online",
      isUnlocked: true,
      step: current.step || "/online/results",
      createdAt: current.createdAt || new Date().toISOString(),
      listingUrl: current.listingUrl ?? null,
      vehicle: current.vehicle ?? {},
      sections: current.sections ?? [],
      photos: current.photos ?? { listing: [], meta: [] },
    };

    saveOnlineResults(updated);
    setResult(updated);
    setIsUnlocked(true);
  }

  // --------------------------------
  // Simple card component
  // --------------------------------
  function Card(props: { title: string; children: ReactNode; className?: string }) {
    return (
      <div
        className={`border rounded-lg p-4 bg-white/5/0 ${
          props.className ?? ""
        }`}
      >
        <h2 className="font-semibold mb-2">{props.title}</h2>
        {props.children}
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
      <Card title="What this means for you">
        <p className="text-muted-foreground whitespace-pre-line">
          {confidence.meaning}
        </p>
      </Card>

      {/* PREVIEW SUMMARY */}
      <Card title="CarVerity analysis — preview">
        <p className="text-muted-foreground whitespace-pre-line">
          {(
            parsed.analysisSummary ||
            parsed.confidenceAssessment ||
            summary
          )
            .split("\n")
            .slice(0, 6)
            .join("\n")}
          {!isUnlocked &&
            "\n\n(Preview only — full analysis available after unlock)"}
        </p>
      </Card>

      {/* VEHICLE DETAILS */}
      <Card title="Vehicle details">
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
      </Card>

      {/* MISSING DETAILS */}
      {missing.length > 0 && (
        <Card title="Missing or unclear details">
          <ul className="list-disc ml-5 text-muted-foreground">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <p className="text-sm mt-2 text-muted-foreground">
            Missing information isn’t always a problem — but these points are
            worth confirming before moving ahead.
          </p>
        </Card>
      )}

      {/* LOCKED STATE CALLOUT */}
      {!isUnlocked && (
        <Card title="Unlock your full scan">
          <p className="text-muted-foreground mb-3">
            The preview above shows a summary based on the listing. Unlocking
            the full scan will reveal structured risk signals, buyer
            considerations and negotiation insights in a clearer format.
          </p>
          <button
            onClick={handleUnlock}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            Unlock full scan
          </button>
        </Card>
      )}

      {/* FULL ANALYSIS — ONLY WHEN UNLOCKED */}
      {isUnlocked && (
        <>
          <Card title="Key risk signals">
            <p className="text-muted-foreground whitespace-pre-line">
              {parsed.keyRiskSignals ||
                "The listing doesn’t highlight any specific risks beyond normal used-car wear based on the available information."}
            </p>
          </Card>

          <Card title="Buyer considerations">
            <p className="text-muted-foreground whitespace-pre-line">
              {parsed.buyerConsiderations ||
                "Use this listing as a starting point, then confirm key details in person — including paperwork, visible condition and how the car feels to drive."}
            </p>
          </Card>

          <Card title="Negotiation insights">
            <p className="text-muted-foreground whitespace-pre-line">
              {parsed.negotiationInsights ||
                "Consider how the car’s age, kilometres, service history and any cosmetic issues line up with the asking price when discussing an offer."}
            </p>
          </Card>

          {sections.length > 0 && (
            <Card title="Additional analysis">
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
            </Card>
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
        </>
      )}
    </div>
  );
}
