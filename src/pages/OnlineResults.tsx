// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult as BaseSavedResult,
} from "../utils/onlineResults";

/**
 * Stored result from localStorage + a couple of UI-only helpers.
 */
type DisplayResult = BaseSavedResult & {
  confidenceLabel?: string;
  confidenceCode?: "LOW" | "MODERATE" | "HIGH" | string;
};

/**
 * Build a short, user-friendly preview from the long AI text.
 * Strips **markdown** and trims to a sensible length.
 */
function buildPreviewText(text: string, maxChars = 350): string {
  if (!text) return "";

  // Strip simple markdown markers
  const stripped = text
    .replace(/\*\*/g, "")
    .replace(/[_#>-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (stripped.length <= maxChars) return stripped;

  const truncated = stripped.slice(0, maxChars);
  const lastFullStop = truncated.lastIndexOf(".");
  if (lastFullStop > 80) {
    return truncated.slice(0, lastFullStop + 1);
  }
  return truncated + "…";
}

export default function OnlineResults() {
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Load + normalise on mount
  useEffect(() => {
    const stored = loadOnlineResults() as DisplayResult | null;

    if (stored) {
      // Always start in locked preview mode
      const locked: DisplayResult = { ...stored, isUnlocked: false };
      saveOnlineResults(locked);
      setResult(locked);
      setIsUnlocked(false);
    }
  }, []);

  function handleUnlock() {
    if (!result) return;

    const updated: DisplayResult = { ...result, isUnlocked: true };
    saveOnlineResults(updated);
    setResult(updated);
    setIsUnlocked(true);
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results found</h1>
        <p className="text-muted-foreground mb-6">
          It looks like there are no saved online scan results yet.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/scan/online"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start an online scan
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  const listingUrl = result.listingUrl ?? "";

  const confidenceLabel =
    result.confidenceLabel ??
    (result.confidenceCode === "HIGH"
      ? "High — looks solid overall"
      : result.confidenceCode === "LOW"
      ? "Low — proceed with caution"
      : result.confidenceCode === "MODERATE"
      ? "Moderate — a few things to confirm"
      : "Not assessed");

  const fullAnalysisBody = result.summary ?? "";

  const previewText = buildPreviewText(fullAnalysisBody || result.conditionSummary || "");

  // Optional structured sections from the backend
  const keyRisks =
    result.sections?.find((s) => s.title === "Key risk signals") ?? null;
  const buyerConsiderations =
    result.sections?.find((s) => s.title === "Buyer considerations") ?? null;
  const negotiationInsights =
    result.sections?.find((s) => s.title === "Negotiation insights") ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      {/* Page title */}
      <h1 className="text-2xl font-semibold mb-1">
        Scan results — AI-assisted review
      </h1>

      {/* Listing ref */}
      {listingUrl && (
        <p className="text-sm text-muted-foreground">
          Listing analysed:{" "}
          <a
            href={listingUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline"
          >
            {listingUrl}
          </a>
        </p>
      )}

      {/* Confidence chip */}
      <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2 text-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
        <span className="font-medium">
          Confidence assessment: {confidenceLabel}
        </span>
      </div>

      {/* What this means for you */}
      {result.conditionSummary && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed">
          <h2 className="font-semibold text-base mb-1">
            What this means for you
          </h2>
          <p>{result.conditionSummary}</p>
        </section>
      )}

      {/* Preview: always short, always free */}
      {previewText && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed space-y-2">
          <h2 className="font-semibold text-base">
            CarVerity analysis — preview
          </h2>
          <p>{previewText}</p>
          <p className="text-xs opacity-70">
            (Free preview — the full scan provides a deeper, listing-specific breakdown.)
          </p>
        </section>
      )}

      {/* Vehicle details */}
      <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm">
        <h2 className="font-semibold text-base mb-2">Vehicle details</h2>
        <dl className="space-y-1">
          <DetailRow label="Make" value={(result.vehicle as any)?.make} />
          <DetailRow label="Model" value={(result.vehicle as any)?.model} />
          <DetailRow label="Year" value={(result.vehicle as any)?.year} />
          <DetailRow label="Variant" value={(result.vehicle as any)?.variant} />
          <DetailRow label="Kilometres" value={result.kilometres} />
        </dl>
      </section>

      {/* Locked full write-up */}
      {fullAnalysisBody && (
        <section className="space-y-2">
          {renderLockableSection(
            "Full AI analysis",
            fullAnalysisBody,
            isUnlocked,
            handleUnlock
          )}
        </section>
      )}

      {/* Optional structured premium sections */}
      {(keyRisks || buyerConsiderations || negotiationInsights) && (
        <section className="space-y-4">
          {renderLockableSection(
            "Key risk signals",
            keyRisks?.content ?? "",
            isUnlocked,
            handleUnlock
          )}
          {renderLockableSection(
            "Buyer considerations",
            buyerConsiderations?.content ?? "",
            isUnlocked,
            handleUnlock
          )}
          {renderLockableSection(
            "Negotiation insights",
            negotiationInsights?.content ?? "",
            isUnlocked,
            handleUnlock
          )}
        </section>
      )}
    </div>
  );
}

/* ------------ Small helpers ------------ */

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 text-muted-foreground">{label}:</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

/**
 * Shared lockable section:
 * - blurred content when locked
 * - centred CTA to unlock
 */
function renderLockableSection(
  title: string,
  body: string,
  isUnlocked: boolean,
  onUnlock: () => void
) {
  if (!body) return null;

  return (
    <section className="relative rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed overflow-hidden">
      <h2 className="font-semibold text-base mb-2">{title}</h2>

      <div className={isUnlocked ? "space-y-2" : "space-y-2 blur-sm select-none"}>
        {body.split("\n").map((line, idx) =>
          line.trim() ? <p key={idx}>{line}</p> : <p key={idx} className="h-1" />
        )}
      </div>

      {!isUnlocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto text-center space-y-2 bg-black/65 px-4 py-3 rounded-md">
            <p className="text-xs opacity-90">
              Full scan locked — unlock to reveal detailed risk signals,
              tailored buyer checks and negotiation insights for this listing.
            </p>
            <button
              type="button"
              onClick={onUnlock}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Unlock full scan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
