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
import { analyseImageAuthenticity } from "../utils/imageAuthenticity";

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [photoScore, setPhotoScore] =
    useState<PhotoTransparencyResult | null>(null);

  const [authCheck, setAuthCheck] = useState<any | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;

    setResult(stored);

    const listingPhotos: string[] = stored.photos?.listing ?? [];
    const hashMeta: any[] = stored.photos?.meta ?? [];

    if (listingPhotos.length > 0) {
      const score = calculatePhotoTransparency(listingPhotos);
      setPhotoScore(score);
    }

    if (hashMeta.length > 0) {
      const authenticity = analyseImageAuthenticity(hashMeta);
      setAuthCheck(authenticity);
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
  const photos = result.photos?.listing ?? [];
  const vehicle = result.vehicle ?? {};

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI analysis
      </h1>

      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        <a
          href={result.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline"
        >
          {result.listingUrl}
        </a>
      </p>

      {/* Photo transparency score */}
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

      {/* Image authenticity */}
      {authCheck && (
        <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/30">
          <span className="font-medium block mb-1">
            Image authenticity check
          </span>
          <p className="text-xs text-muted-foreground">
            {authCheck.summary}
          </p>
        </div>
      )}

      {/* Vehicle details */}
      <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/20">
        <h2 className="font-semibold mb-2">Vehicle details</h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Make</span>
          <span>{vehicle.make || "—"}</span>

          <span className="text-muted-foreground">Model</span>
          <span>{vehicle.model || "—"}</span>

          <span className="text-muted-foreground">Year</span>
          <span>{vehicle.year || "—"}</span>

          <span className="text-muted-foreground">Variant</span>
          <span>{vehicle.variant || "—"}</span>

          <span className="text-muted-foreground">Import status</span>
          <span>{vehicle.importStatus || "—"}</span>

          <span className="text-muted-foreground">Condition notes</span>
          <span>{result.conditionSummary || "—"}</span>
        </div>
      </div>

      {/* Vehicle context (CLEAN + PROFESSIONAL) */}
      <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/20">
        <h2 className="font-semibold mb-2">Vehicle context provided</h2>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Kilometres</span>
          <span>{result.kilometres || "—"}</span>

          <span className="text-muted-foreground">Previous owners</span>
          <span>{result.owners || "—"}</span>

          <span className="text-muted-foreground">Notes</span>
          <span>{result.notes || "—"}</span>
        </div>
      </div>

      {/* Listing photo thumbnails */}
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

      {/* Lightbox viewer */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i! > 0 ? i! - 1 : i))}
          onNext={() =>
            setLightboxIndex(i =>
              i! < photos.length - 1 ? i! + 1 : i
            )
          }
        />
      )}

      {/* Risk signals */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key risk signals</h2>

        {result.signals.length > 0 ? (
          <ul className={`list-disc pl-4 ${locked ? "blur-sm" : ""}`}>
            {result.signals.map((s, i) => (
              <li key={i}>{s?.text ?? "Unnamed signal"}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No explicit risk signals detected in this listing.
          </p>
        )}
      </div>

      {/* AI sections */}
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

      {/* Unlock CTA */}
      {locked && (
        <div className="mt-6 p-4 border border-white/20 rounded-lg bg-black/30">
          <p className="mb-3 text-sm text-muted-foreground">
            You’re viewing a preview. Unlock the full report without using
            another credit.
          </p>

          <button
            onClick={() => {
              unlockOnlineResults();
              setResult(loadOnlineResults());
            }}
            className="px-4 py-2 rounded bg-blue-500 text-black font-semibold"
          >
            Unlock full report
          </button>
        </div>
      )}
    </div>
  );
}
