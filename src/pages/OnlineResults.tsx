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

  // ---- Helper: hide JSON-vomit sections ----
  function isJsonVomit(section: any) {
    const t = (section?.title ?? "").toLowerCase();
    const c = (section?.content ?? "").trim();
    return (
      t.includes("vehicle context") ||
      c.startsWith("{") ||
      c.startsWith("[")
    );
  }

  // ---- Extract AI buyer insights for structured display ----
  const aiInsightsSection = (result.sections ?? []).find(
    (s) =>
      (s?.title ?? "").toLowerCase().includes("ai buyer insights")
  );

  /** Parse Gemini output format:
   *   KEY RISKS
   *   • item
   *   • item
   *
   *   WHAT TO CHECK NEXT
   *   • item
   *   • item
   */
  function parseAiInsights(text: string) {
    const risks: string[] = [];
    const checks: string[] = [];

    let mode: "risks" | "checks" | null = null;

    text.split("\n").forEach((line) => {
      const l = line.trim();

      if (l.toUpperCase().startsWith("KEY RISKS")) {
        mode = "risks";
        return;
      }

      if (l.toUpperCase().startsWith("WHAT TO CHECK")) {
        mode = "checks";
        return;
      }

      if (l.startsWith("•")) {
        const cleaned = l.replace(/^•\s*/, "").trim();
        if (mode === "risks") risks.push(cleaned);
        if (mode === "checks") checks.push(cleaned);
      }
    });

    return { risks, checks };
  }

  const parsed =
    aiInsightsSection?.content
      ? parseAiInsights(aiInsightsSection.content)
      : { risks: [], checks: [] };

  // ---- Remove AI insights from generic sections list (avoid duplication) ----
  const cleanSections = (result.sections ?? []).filter(
    (s) =>
      !isJsonVomit(s) &&
      !(s?.title ?? "").toLowerCase().includes("ai buyer insights")
  );

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
          <span>
            {vehicle.importStatus === "unknown"
              ? "Not specified in listing"
              : vehicle.importStatus || "—"}
          </span>

          <span className="text-muted-foreground">Condition notes</span>
          <span>{result.conditionSummary || "—"}</span>
        </div>
      </div>

      {/* Listing photos */}
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

      {/* Lightbox */}
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

      {/* Structured AI insights */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2">Key risk signals</h2>

        {parsed.risks.length > 0 ? (
          <ul className={`list-disc pl-4 ${locked ? "blur-sm" : ""}`}>
            {parsed.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No obvious risks identified based on the information provided so far.
          </p>
        )}
      </div>

      <div className={`mb-8 ${locked ? "blur-sm pointer-events-none" : ""}`}>
        <h2 className="font-semibold mb-2">What to check next</h2>

        {parsed.checks.length > 0 ? (
          <ul className="list-disc pl-4">
            {parsed.checks.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No specific follow-up actions were identified for this listing.
          </p>
        )}
      </div>

      {/* Remaining analysis sections (non-AI) */}
      <div className={locked ? "blur-sm pointer-events-none" : ""}>
        <h2 className="font-semibold mb-2">Analysis details</h2>

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
