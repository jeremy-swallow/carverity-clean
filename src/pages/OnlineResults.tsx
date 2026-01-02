// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult as BaseSavedResult,
} from "../utils/onlineResults";

type DisplayResult = BaseSavedResult & {
  confidenceLabel?: string;
  confidenceCode?: "LOW" | "MODERATE" | "HIGH" | string;
};

export default function OnlineResults() {
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults() as DisplayResult | null;
    if (stored) {
      setResult(stored);
      setIsUnlocked(!!stored.isUnlocked);
    }
  }, []);

  function handleUnlock() {
    if (!result) return;

    const updated = { ...result, isUnlocked: true };
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

        <Link
          to="/scan/online"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium"
        >
          Start an online scan
        </Link>
      </div>
    );
  }

  const confidenceLabel =
    result.confidenceLabel ??
    (result.confidenceCode === "HIGH"
      ? "High — looks solid overall"
      : result.confidenceCode === "LOW"
      ? "Low — proceed with caution"
      : result.confidenceCode === "MODERATE"
      ? "Moderate — a few things to confirm"
      : "Not assessed");

  const listingUrl = result.listingUrl || "";

  const keyRisks =
    result.sections?.find((s) => s.title === "Key risk signals") ?? null;
  const buyerConsiderations =
    result.sections?.find((s) => s.title === "Buyer considerations") ?? null;
  const negotiationInsights =
    result.sections?.find((s) => s.title === "Negotiation insights") ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Scan results — AI-assisted review</h1>

      {listingUrl && (
        <p className="text-sm text-muted-foreground">
          Listing analysed:{" "}
          <a href={listingUrl} target="_blank" rel="noreferrer" className="underline">
            {listingUrl}
          </a>
        </p>
      )}

      <div className="rounded-md border bg-white/5 px-4 py-3 text-sm flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
        Confidence assessment: {confidenceLabel}
      </div>

      {result.conditionSummary && (
        <section className="rounded-md border bg-white/5 px-4 py-4 text-sm leading-relaxed">
          <h2 className="font-semibold mb-1">What this means for you</h2>
          <p>{result.conditionSummary}</p>
        </section>
      )}

      {result.summary && (
        <section className="rounded-md border bg-white/5 px-4 py-4 text-sm leading-relaxed">
          <h2 className="font-semibold">CarVerity analysis — preview</h2>
          <p>{result.summary}</p>
          <p className="text-xs opacity-70 mt-1">
            (Free preview — the full scan provides a deeper listing-specific breakdown.)
          </p>
        </section>
      )}

      {renderLock("Key risk signals", keyRisks?.content ?? "", isUnlocked, handleUnlock)}
      {renderLock("Buyer considerations", buyerConsiderations?.content ?? "", isUnlocked, handleUnlock)}
      {renderLock("Negotiation insights", negotiationInsights?.content ?? "", isUnlocked, handleUnlock)}
    </div>
  );
}

function renderLock(
  title: string,
  body: string,
  unlocked: boolean,
  onUnlock: () => void
) {
  if (!body) return null;

  return (
    <section className="relative rounded-md border bg-white/5 px-4 py-4 text-sm leading-relaxed overflow-hidden">
      <h2 className="font-semibold mb-2">{title}</h2>

      <div className={unlocked ? "space-y-2" : "space-y-2 blur-sm"}>
        {body.split("\n").map((line, i) =>
          line.trim() ? <p key={i}>{line}</p> : <p key={i} className="h-1" />
        )}
      </div>

      {!unlocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto text-center space-y-2">
            <div className="text-xs opacity-80">
              Full scan locked — unlock to reveal all insights.
            </div>
            <button
              onClick={onUnlock}
              className="bg-primary px-4 py-2 rounded-md text-xs font-medium"
            >
              Unlock full scan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
