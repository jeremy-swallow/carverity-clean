// src/pages/OnlineResults.tsx
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

    const listingPhotos = stored.photos.listing;
    const hashMeta = stored.photos.meta;

    if (listingPhotos.length > 0) {
      setPhotoScore(calculatePhotoTransparency(listingPhotos));
    }

    if (hashMeta.length > 0) {
      setAuthCheck(analyseImageAuthenticity(hashMeta));
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
  const photos = result.photos.listing;
  const vehicle = result.vehicle ?? {};

  function isJsonNoise(section: any) {
    const t = (section?.title ?? "").toLowerCase();
    const c = (section?.content ?? "").trim();
    return (
      t.includes("vehicle context") ||
      c.startsWith("{") ||
      c.startsWith("[")
    );
  }

  const aiInsights =
    result.sections.find((s) =>
      (s?.title ?? "").toLowerCase().includes("ai buyer insights")
    )?.content ?? "";

  function parseInsights(text: string) {
    const risks: string[] = [];
    const checks: string[] = [];

    const normalized = text
      .replace(/\s+/g, " ")
      .replace(/•/g, "\n•")
      .replace(/KEY RISKS/gi, "\nKEY RISKS\n")
      .replace(/WHAT TO CHECK NEXT/gi, "\nWHAT TO CHECK NEXT\n");

    let mode: "risks" | "checks" | null = null;

    normalized.split("\n").forEach((lineRaw) => {
      const line = lineRaw.trim();
      if (!line) return;

      if (line.toUpperCase().startsWith("KEY RISKS")) {
        mode = "risks";
        return;
      }

      if (line.toUpperCase().startsWith("WHAT TO CHECK")) {
        mode = "checks";
        return;
      }

      if (line.startsWith("•")) {
        const cleaned = line.replace(/^•\s*/, "").trim();
        if (!cleaned) return;
        if (mode === "risks") risks.push(cleaned);
        if (mode === "checks") checks.push(cleaned);
      }
    });

    return { risks, checks };
  }

  const parsed = parseInsights(aiInsights);

  const cleanSections = result.sections.filter(
    (s) =>
      !isJsonNoise(s) &&
      !(s?.title ?? "").toLowerCase().includes("ai buyer insights")
  );

  function photoTransparencyMessage() {
    const count = photos.length;

    if (count >= 8)
      return "This listing includes strong photo coverage for review.";
    if (count >= 5)
      return "Good photo coverage. A few extra angles can sometimes help when available.";
    if (count >= 1)
      return "Limited photo coverage. Ask the seller for more angles if possible.";
    return "No photos detected in this listing.";
  }

  const safeListingUrl = result.listingUrl ?? "#";
  const listingLabel =
    result.listingUrl ?? "Listing URL not saved in this scan";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">
        Scan results — AI-assisted review
      </h1>

      <p className="mb-6 break-all text-sm text-muted-foreground">
        Listing analysed:
        <br />
        <a
          href={safeListingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline"
        >
          {listingLabel}
        </a>
      </p>

      {/* Summary */}
      <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/30">
        <h2 className="font-semibold mb-1">CarVerity review summary</h2>
        <p className="text-sm text-muted-foreground">
          {result.summary || "No summary available for this scan."}
        </p>
      </div>

      {/* Concerns */}
      <div className="mb-6 p-4 border border-amber-300/30 rounded-lg bg-amber-500/5">
        <h2 className="font-semibold mb-2">Potential concerns</h2>

        {parsed.risks.length > 0 ? (
          <ul className={`list-disc pl-4 ${locked ? "blur-sm" : ""}`}>
            {parsed.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No obvious concerns identified from the details available so far.
          </p>
        )}
      </div>

      {/* Next steps */}
      <div
        className={`mb-8 p-4 border border-blue-300/30 rounded-lg bg-blue-500/5 ${
          locked ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <h2 className="font-semibold mb-2">Recommended next steps</h2>

        {parsed.checks.length > 0 ? (
          <ul className="list-disc pl-4">
            {parsed.checks.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No specific follow-up actions suggested for this listing.
          </p>
        )}
      </div>

      {/* Photo transparency */}
      {photoScore && (
        <div className="mb-6 p-4 border border-white/10 rounded-lg bg-black/30">
          <div className="flex justify-between">
            <span className="font-medium">Photo transparency score</span>
            <span className="font-semibold">{photoScore.score}/10</span>
          </div>

          <p className="text-xs mt-1 text-muted-foreground">
            {photoTransparencyMessage()}
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
          <span>
            {vehicle.importStatus === "unknown"
              ? "Not specified in listing"
              : vehicle.importStatus || "—"}
          </span>

          <span className="text-muted-foreground">Condition notes</span>
          <span>{result.conditionSummary || "—"}</span>
        </div>
      </div>

      {/* Photos */}
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

      {/* Additional analysis */}
      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Additional analysis</h2>

        {cleanSections.length > 0 ? (
          cleanSections.map((section, i) => (
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
            No additional sections returned.
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
