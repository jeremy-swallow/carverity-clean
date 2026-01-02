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

    const updated: DisplayResult = { ...result, isUnlocked: true };
    saveOnlineResults(updated);
    setResult(updated);
    setIsUnlocked(true);
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
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
            className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Back to homepage
          </Link>
        </div>
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
          <a href={listingUrl} target="_blank" rel="noreferrer" className="underline text-blue-400">
            {listingUrl}
          </a>
        </p>
      )}

      <div className="rounded-md border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-2 text-sm">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
        <span className="font-medium">
          Confidence assessment: {confidenceLabel}
        </span>
      </div>

      {result.conditionSummary && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed space-y-1">
          <h2 className="font-semibold text-base mb-1">What this means for you</h2>
          <p>{result.conditionSummary}</p>
        </section>
      )}

      {result.summary && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm space-y-2 leading-relaxed">
          <h2 className="font-semibold text-base">CarVerity analysis — preview</h2>
          <p>{result.summary}</p>
          <p className="text-xs opacity-70">
            (Free preview — the full scan provides a deeper listing-specific breakdown.)
          </p>
        </section>
      )}

      <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm">
        <h2 className="font-semibold text-base mb-2">Vehicle details</h2>
        <dl className="space-y-1">
          <Row label="Make" value={(result.vehicle as any)?.make} />
          <Row label="Model" value={(result.vehicle as any)?.model} />
          <Row label="Year" value={(result.vehicle as any)?.year} />
          <Row label="Variant" value={(result.vehicle as any)?.variant} />
          <Row label="Kilometres" value={result.kilometres} />
        </dl>
      </section>

      {result.notes && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed">
          <h2 className="font-semibold text-base mb-2">Missing or unclear details</h2>
          <p>{result.notes}</p>
        </section>
      )}

      {(keyRisks || buyerConsiderations || negotiationInsights) && (
        <section className="space-y-4">
          {renderLockable("Key risk signals", keyRisks?.content ?? "", isUnlocked, handleUnlock)}
          {renderLockable("Buyer considerations", buyerConsiderations?.content ?? "", isUnlocked, handleUnlock)}
          {renderLockable("Negotiation insights", negotiationInsights?.content ?? "", isUnlocked, handleUnlock)}
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 text-muted-foreground">{label}:</dt>
      <dd>{value ?? "—"}</dd>
    </div>
  );
}

function renderLockable(
  title: string,
  body: string,
  isUnlocked: boolean,
  onUnlock: () => void
) {
  if (!body) return null;

  return (
    <section className="relative rounded-md border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed overflow-hidden">
      <h2 className="font-semibold text-base mb-2">{title}</h2>

      <div className={isUnlocked ? "space-y-2" : "space-y-2 blur-sm"}>
        {body.split("\n").map((line, i) => (line.trim() ? <p key={i}>{line}</p> : <p key={i} className="h-1" />))}
      </div>

      {!isUnlocked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto text-center space-y-2">
            <div className="text-xs text-muted-foreground">
              Full scan locked
              <br />
              <span className="opacity-80">
                Unlock to reveal risk signals, tailored buyer checks and negotiation insights.
              </span>
            </div>

            <button
              onClick={onUnlock}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs font-medium hover:bg-primary/90"
            >
              Unlock full scan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
