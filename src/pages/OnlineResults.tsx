import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";

interface ResultSection {
  title: string;
  content: string;
}

interface SavedResult {
  type: "online";
  step: string;
  createdAt: string;
  listingUrl: string | null;
  vehicle: any;
  confidenceCode?: "LOW" | "MODERATE" | "HIGH";
  previewSummary?: string | null;
  fullSummary?: string | null;
  summary?: string | null;
  sections: ResultSection[];
  photos: any;
  isUnlocked: boolean;
}

/* =========================================================
   UI Helpers
========================================================= */

function Card(props: any) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-lg">
      {props.children}
    </div>
  );
}

function Pill({ code }: { code?: string }) {
  if (!code) return null;

  const palette: Record<string, string> = {
    LOW: "bg-emerald-900/40 text-emerald-200 border-emerald-700/40",
    MODERATE: "bg-amber-900/40 text-amber-200 border-amber-700/40",
    HIGH: "bg-rose-900/40 text-rose-200 border-rose-700/40",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs border ${palette[code] || ""}`}>
      {code} — listing confidence
    </span>
  );
}

/* =========================================================
   Confidence-aware conversion teaser
========================================================= */

function buildPreviewTeaser(
  confidence: string | undefined,
  source: string | null | undefined
): string {
  const DEFAULT_HOOK =
    "The full scan gives clearer guidance on what’s worth checking in person, along with neutral risk context and practical negotiation tips tailored to this listing.";

  // Try to extract a meaningful first line from model output
  const first = source
    ?.replace(/\*\*|#+|\-/g, "")
    .split(/\.\s+/)[0]
    .trim();

  const usable =
    first && first.length > 40 && !first.includes("CONFIDENCE_CODE")
      ? first.slice(0, 200).trim()
      : null;

  // Tone-matched hooks
  if (confidence === "LOW") {
    return (
      (usable ||
        "This scan suggests the listing generally looks comfortable so far, with no major concerns standing out.") +
      ". The full report includes supportive inspection tips and confidence-based context to help you feel reassured when you see the car in person."
    );
  }

  if (confidence === "MODERATE") {
    return (
      (usable ||
        "This scan highlights a few details that are worth confirming in person, while the overall listing still presents positively.") +
      ". The full report adds clearer guidance on what to focus on during inspection, plus helpful context and negotiation pointers tailored to this car."
    );
  }

  if (confidence === "HIGH") {
    return (
      (usable ||
        "This scan found a few meaningful details that would benefit from closer attention when you inspect the car in person.") +
      ". The full report provides calm, practical guidance on what to check carefully, along with supportive next-step advice for your decision."
    );
  }

  return DEFAULT_HOOK;
}

/* =========================================================
   Component
========================================================= */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setResult(stored);
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan found</h1>
        <p className="text-muted-foreground">Run a scan to view your CarVerity results.</p>
      </div>
    );
  }

  const {
    vehicle,
    confidenceCode,
    previewSummary,
    fullSummary,
    summary,
    isUnlocked,
  } = result;

  const reportText = fullSummary || summary || "";
  const teaser = buildPreviewTeaser(confidenceCode, previewSummary || reportText);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700/60 to-purple-700/60 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h1 className="text-lg font-semibold">CarVerity online scan results</h1>
        <p className="text-slate-200/80">
          Independent guidance based on the details in this listing.
        </p>
      </div>

      {/* Confidence */}
      <Card>
        <h2 className="text-xs font-medium text-slate-300 mb-2 tracking-wide">
          LISTING CONFIDENCE
        </h2>
        <Pill code={confidenceCode} />
      </Card>

      {/* Intro */}
      <Card>
        <h2 className="text-xs font-medium text-slate-300 mb-2 tracking-wide">
          CONFIDENCE ASSESSMENT
        </h2>
        <p className="text-slate-100">
          Hello there! Let’s take a closer look at this {vehicle?.year} {vehicle?.make}{" "}
          {vehicle?.model} to help you feel confident and informed.
        </p>
      </Card>

      {/* Preview (locked) */}
      {!isUnlocked && (
        <Card>
          <h2 className="text-xs font-medium text-slate-300 mb-2 tracking-wide">
            CARVERITY ANALYSIS — PREVIEW
          </h2>

          <p className="text-slate-100 mb-3">{teaser}</p>

          <div className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-slate-300 text-sm mb-3">
            Full report content is locked
          </div>

          <button
            className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
            onClick={() => window.location.reload()}
          >
            Unlock full scan (testing)
          </button>

          <p className="text-xs text-slate-400 mt-1">
            In the live app this area unlocks after purchasing a scan.
          </p>
        </Card>
      )}

      {/* Full Report (unlocked) */}
      {isUnlocked && (
        <Card>
          <pre className="whitespace-pre-wrap text-slate-100 leading-relaxed text-sm">
            {reportText}
          </pre>
        </Card>
      )}

      {/* Vehicle details */}
      <Card>
        <h2 className="text-xs font-medium text-slate-300 mb-2 tracking-wide">
          VEHICLE DETAILS
        </h2>

        <div className="divide-y divide-white/10 text-slate-100 text-sm">
          <div className="flex justify-between py-1"><span>Make</span><span>{vehicle?.make}</span></div>
          <div className="flex justify-between py-1"><span>Model</span><span>{vehicle?.model}</span></div>
          <div className="flex justify-between py-1"><span>Year</span><span>{vehicle?.year}</span></div>
          <div className="flex justify-between py-1"><span>Kilometres</span><span>{vehicle?.kilometres}</span></div>
        </div>
      </Card>
    </div>
  );
}
