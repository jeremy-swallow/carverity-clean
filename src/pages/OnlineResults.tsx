import { useEffect, useState } from "react";
import { loadOnlineResults, saveOnlineResults } from "../utils/onlineResults";

/**
 * Extracts structured sections from the Gemini report text.
 */
function parseReportSections(text: string) {
  if (!text) return {};

  const sections: Record<string, string> = {};

  const patterns: Record<string, RegExp> = {
    confidence: /CONFIDENCE ASSESSMENT[\r\n]+([\s\S]*?)(?=\n{2,}|CONFIDENCE_CODE:|WHAT THIS MEANS FOR YOU|$)/i,
    whatThisMeans: /WHAT THIS MEANS FOR YOU[\r\n]+([\s\S]*?)(?=\n{2,}|CARVERITY ANALYSIS|$)/i,
    summary: /CARVERITY ANALYSIS[\s–-]*SUMMARY[\r\n]+([\s\S]*?)(?=\n{2,}|KEY RISK SIGNALS|$)/i,
    risks: /KEY RISK SIGNALS[\r\n]+([\s\S]*?)(?=\n{2,}|BUYER CONSIDERATIONS|$)/i,
    considerations: /BUYER CONSIDERATIONS[\r\n]+([\s\S]*?)(?=\n{2,}|NEGOTIATION INSIGHTS|$)/i,
    negotiation: /NEGOTIATION INSIGHTS[\r\n]+([\s\S]*?)(?=\n{2,}|GENERAL OWNERSHIP NOTES|$)/i,
    ownership: /GENERAL OWNERSHIP NOTES[\r\n]+([\s\S]*?)$/i,
  };

  for (const key of Object.keys(patterns)) {
    const match = text.match(patterns[key]);
    if (match?.[1]) sections[key] = match[1].trim();
  }

  return sections;
}

/**
 * Formats multiline text safely.
 */
function TextBlock({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
      {value.trim()}
    </pre>
  );
}

/**
 * Converts a confidence code into a warm human-sentence.
 */
function confidenceToSentence(code?: string | null): string {
  if (!code) return "This listing looks like a reasonable starting point so far.";
  switch (code.toUpperCase()) {
    case "LOW":
      return "This listing looks like a comfortable starting point so far — nothing concerning stands out from the details provided.";
    case "MODERATE":
      return "This listing looks mostly positive, with a couple of details that are worth checking in person to make sure it feels right for you.";
    case "HIGH":
      return "This listing may still be worth considering, but there are a few important details you’ll want to check carefully in person before moving ahead.";
    default:
      return "This listing looks like a reasonable starting point so far.";
  }
}

export default function OnlineResults() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setResult(loadOnlineResults());
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-muted-foreground">
          Run a scan to see your CarVerity results.
        </p>
      </div>
    );
  }

  const {
    vehicle = {},
    confidenceCode,
    previewSummary,
    fullSummary,
    summary,
    isUnlocked,
  } = result;

  const reportText = fullSummary || summary || "";
  const parsed = parseReportSections(reportText);

  const preview =
    previewSummary ??
    (summary?.split("\n").slice(0, 4).join(" ").trim() || null);

  function unlockForTesting() {
    const updated = { ...result, isUnlocked: true };
    saveOnlineResults(updated);
    setResult(updated);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE CARD */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Confidence assessment
        </h2>
        <p className="text-white text-sm leading-relaxed">
          {confidenceToSentence(confidenceCode)}
        </p>
      </section>

      {/* PREVIEW (LOCKED) */}
      {!isUnlocked && (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h2 className="text-sm text-muted-foreground">
            CarVerity analysis — preview
          </h2>

          {preview ? (
            <p className="text-slate-200 text-sm leading-relaxed">
              {preview}…
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Preview not available.
            </p>
          )}

          <p className="text-indigo-300 text-xs">
            The full scan provides more context about what’s worth checking in
            person when you see the car.
          </p>

          {/* Blurred locked block */}
          <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/40 backdrop-blur-sm p-4">
            <p className="text-slate-400 text-sm italic opacity-70">
              Full scan content is locked
            </p>
          </div>

          {/* Developer unlock button */}
          <button
            onClick={unlockForTesting}
            className="mt-3 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
          >
            Unlock full scan (testing)
          </button>
        </section>
      )}

      {/* FULL REPORT (UNLOCKED) */}
      {isUnlocked && reportText && (
        <div className="space-y-6">

          {parsed.confidence && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Confidence assessment — full detail
              </h3>
              <TextBlock value={parsed.confidence} />
            </section>
          )}

          {parsed.whatThisMeans && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                What this means for you
              </h3>
              <TextBlock value={parsed.whatThisMeans} />
            </section>
          )}

          {parsed.summary && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                CarVerity analysis — summary
              </h3>
              <TextBlock value={parsed.summary} />
            </section>
          )}

          {parsed.risks && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Things to check in person
              </h3>
              <TextBlock value={parsed.risks} />
            </section>
          )}

          {parsed.considerations && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Helpful things to focus on during inspection
              </h3>
              <TextBlock value={parsed.considerations} />
            </section>
          )}

          {parsed.negotiation && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Negotiation insights
              </h3>
              <TextBlock value={parsed.negotiation} />
            </section>
          )}

          {parsed.ownership && (
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                General ownership notes
              </h3>
              <TextBlock value={parsed.ownership} />
            </section>
          )}
        </div>
      )}

      {/* VEHICLE DETAILS */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-sm text-muted-foreground mb-2">
          Vehicle details
        </h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground block">Make</span>
            <span>{vehicle.make || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Model</span>
            <span>{vehicle.model || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Year</span>
            <span>{vehicle.year || "—"}</span>
          </div>

          <div>
            <span className="text-muted-foreground block">Kilometres</span>
            <span>{vehicle.kilometres || "—"}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
