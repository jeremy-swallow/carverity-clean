import { useEffect, useState } from "react";

import {
  loadOnlineResults,
  unlockOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

import {
  calculatePhotoTransparency,
  type PhotoTransparencyResult,
} from "../utils/photoTransparency";

import PhotoLightbox from "../components/PhotoLightbox";

function SellerBadge({ type }: { type?: string }) {
  const label =
    type === "dealer"
      ? "Dealer"
      : type === "private"
      ? "Private seller"
      : type === "marketplace"
      ? "Marketplace vendor"
      : "Unknown seller";

  const color =
    type === "dealer"
      ? "bg-blue-400 text-black"
      : type === "private"
      ? "bg-emerald-400 text-black"
      : type === "marketplace"
      ? "bg-amber-300 text-black"
      : "bg-slate-700 text-slate-200";

  return (
    <span
      className={`px-2 py-0.5 rounded-lg text-xs font-semibold border border-white/20 ${color}`}
      title="Seller type is inferred using listing structure, wording and page metadata."
    >
      {label}
    </span>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const severity = level ?? "medium";

  const styles =
    severity === "high"
      ? "bg-red-400 text-black"
      : severity === "low"
      ? "bg-emerald-400 text-black"
      : "bg-amber-300 text-black";

  const label =
    severity === "high"
      ? "High risk"
      : severity === "low"
      ? "Low risk"
      : "Medium risk";

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [photoScore, setPhotoScore] =
    useState<PhotoTransparencyResult | null>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;

    setResult(stored);

    const listingPhotos: string[] = stored.photos?.listing ?? [];

    if (listingPhotos.length > 0) {
      const score = calculatePhotoTransparency(listingPhotos);
      setPhotoScore(score);
    }
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">No results available</h1>
        <p className="text-muted-foreground">
          Run a scan first to see your analysis results.
        </p>
      </div>
    );
  }

  const locked = !result.isUnlocked;
  const photos: string[] = result.photos?.listing ?? [];
  const vehicle = result.vehicle ?? {};

  function handleUnlock() {
    unlockOnlineResults();
    const updated = loadOnlineResults();
    setResult(updated);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold">Scan results — AI analysis</h1>
        <SellerBadge type={result.sellerType} />
      </div>

      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        {result.listingUrl}
      </p>

      {photoScore && (
        <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/30">
          <div className="flex justify-between">
            <span className="font-medium">Photo transparency score</span>
            <span className="font-semibold">{photoScore.score}/10</span>
          </div>
          <p className="text-xs mt-1 text-muted-foreground">
            {photoScore.summary}
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold mb-2">Listing photos</h2>

          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/20"
              >
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i! > 0 ? i! - 1 : i))}
          onNext={() =>
            setLightboxIndex((i) =>
              i! < photos.length - 1 ? i! + 1 : i
            )
          }
        />
      )}

      <div className="mb-8 p-4 border border-white/10 rounded-lg bg-black/30">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-400">Make</span>
          <span>{vehicle.make || "—"}</span>

          <span className="text-slate-400">Model</span>
          <span>{vehicle.model || "—"}</span>

          <span className="text-slate-400">Year</span>
          <span>{vehicle.year || "—"}</span>

          <span className="text-slate-400">Variant</span>
          <span>{vehicle.variant || "—"}</span>

          <span className="text-slate-400">Import status</span>
          <span>
            <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-white/10 text-xs">
              {vehicle.importStatus || "Unknown"}
            </span>
          </span>

          <span className="text-slate-400">Kilometres</span>
          <span>{result.kilometres || "—"}</span>

          <span className="text-slate-400">Owners</span>
          <span>{result.owners ?? "—"}</span>
        </div>

        {(result.conditionSummary || result.notes) && (
          <div className="mt-3">
            {result.conditionSummary && (
              <p className="text-sm mb-1">
                <span className="text-slate-400">Condition:</span>{" "}
                {result.conditionSummary}
              </p>
            )}
            {result.notes && (
              <p className="text-sm">
                <span className="text-slate-400">Notes:</span>{" "}
                {result.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Risk signals with severity */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key risk signals</h2>

        {result.signals.length > 0 ? (
          <div className={`${locked ? "blur-sm" : ""}`}>
            {result.signals.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border border-white/10 rounded-lg p-3 mb-2 bg-black/20"
              >
                <RiskBadge level={s?.severity} />
                <span>{s?.text ?? "Unnamed signal"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No explicit risk signals detected in this listing.
          </p>
        )}
      </div>

      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Analysis details</h2>

        {result.sections.length > 0 ? (
          result.sections.map((section, i) => (
            <div
              key={i}
              className="border border-white/10 rounded p-4 mb-4"
            >
              <h3 className="font-medium mb-1">
                {section?.title ?? "Untitled section"}
              </h3>
              <p className="text-muted-foreground">
                {section?.content ?? ""}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No analysis sections returned.
          </p>
        )}
      </div>

      {locked && (
        <div className="mt-6 p-4 border border-white/20 rounded-lg bg-black/30">
          <p className="mb-3 text-sm text-muted-foreground">
            You’re viewing a preview. Unlock the full report without using
            another credit.
          </p>

          <button
            onClick={handleUnlock}
            className="px-4 py-2 rounded bg-blue-500 text-black font-semibold"
          >
            Unlock full report
          </button>
        </div>
      )}
    </div>
  );
}
