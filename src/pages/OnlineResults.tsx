// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { loadOnlineResults } from "../utils/onlineResults";

/**
 * Extracts structured sections from the Gemini report text.
 * Falls back safely if formatting varies or sections are missing.
 */
function parseReportSections(text: string) {
  if (!text) {
    return {};
  }

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
    if (match?.[1]) {
      sections[key] = match[1].trim();
    }
  }

  return sections;
}

/**
 * Renders multiline or markdown-ish text safely.
 */
function TextBlock({ value }: { value?: string }) {
  if (!value) return null;
  return (
    <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
      {value.trim()}
    </pre>
  );
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
    (summary
      ?.split("\n")
      .slice(0, 4)
      .join(" ")
      .trim() || null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* CONFIDENCE */}
      <section className="rounded-lg border border-white/10 p-4">
        <h2 className="text-sm text-muted-foreground mb-1">
          Listing confidence
        </h2>
        <p className="text-white font-medium">
          {confidenceCode
            ? `${confidenceCode} — listing confidence`
            : "Not available"}
        </p>
      </section>

      {/* PREVIEW / FULL REPORT */}
      {!isUnlocked && (
        <section className="rounded-lg border border-white/10 p-4">
          <h2 className="text-sm text-muted-foreground mb-1">
            CarVerity analysis — preview
          </h2>

          {!preview && (
            <p className="text-muted-foreground">No preview available.</p>
          )}

          {preview && (
            <p className="text-slate-200 text-sm leading-relaxed">
              {preview}…{" "}
              <span className="text-indigo-400">
                Unlock full scan to see the complete report.
              </span>
            </p>
          )}
        </section>
      )}

      {/* FULL REPORT — STRUCTURED SECTIONS */}
      {isUnlocked && reportText && (
        <div className="space-y-6">

          {/* CONFIDENCE ASSESSMENT */}
          {parsed.confidence && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Confidence assessment
              </h3>
              <TextBlock value={parsed.confidence} />
            </section>
          )}

          {/* WHAT THIS MEANS FOR YOU */}
          {parsed.whatThisMeans && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                What this means for you
              </h3>
              <TextBlock value={parsed.whatThisMeans} />
            </section>
          )}

          {/* SUMMARY */}
          {parsed.summary && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                CarVerity analysis — summary
              </h3>
              <TextBlock value={parsed.summary} />
            </section>
          )}

          {/* KEY RISK SIGNALS (framed as things to check) */}
          {parsed.risks && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Things to check in person
              </h3>
              <TextBlock value={parsed.risks} />
            </section>
          )}

          {/* BUYER CONSIDERATIONS */}
          {parsed.considerations && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Helpful things to focus on during inspection
              </h3>
              <TextBlock value={parsed.considerations} />
            </section>
          )}

          {/* NEGOTIATION INSIGHTS */}
          {parsed.negotiation && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                Negotiation insights
              </h3>
              <TextBlock value={parsed.negotiation} />
            </section>
          )}

          {/* GENERAL OWNERSHIP NOTES */}
          {parsed.ownership && (
            <section className="rounded-lg border border-white/10 p-4">
              <h3 className="text-sm text-muted-foreground mb-1">
                General ownership notes
              </h3>
              <TextBlock value={parsed.ownership} />
            </section>
          )}
        </div>
      )}

      {/* VEHICLE DETAILS */}
      <section className="rounded-lg border border-white/10 p-4">
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
