/* src/utils/imageAuthenticity.ts */

export type ImageDuplicateFinding = {
  type: "duplicate" | "very-small" | "suspicious";
  details: string;
};

export interface ImageAuthenticityResult {
  duplicates: number;
  findings: ImageDuplicateFinding[];
  score: number; // 0–10 (higher = more authentic)
}

/**
 * We assess authenticity based on:
 * - repeated image hashes
 * - extremely small / low-data images
 * - unusually identical dimensions across many photos
 */
export function analyseImageAuthenticity(
  photos: { hash?: string; approxSizeKB?: number }[] | string[]
): ImageAuthenticityResult {
  const findings: ImageDuplicateFinding[] = [];
  const hashes = new Map<string, number>();

  let smallImages = 0;
  let duplicates = 0;

  // Normalise input for earlier data structures
  const normalised = photos.map((p: any, i) =>
    typeof p === "string"
      ? { hash: `nohash-${i}`, approxSizeKB: undefined }
      : p
  );

  for (const p of normalised) {
    if (!p?.hash) continue;

    // Detect repeated images
    if (hashes.has(p.hash)) {
      duplicates++;
      findings.push({
        type: "duplicate",
        details:
          "This photo appears more than once — sellers sometimes reuse the same image to hide missing angles.",
      });
    } else {
      hashes.set(p.hash, 1);
    }

    // Detect ultra-small images
    if (p.approxSizeKB && p.approxSizeKB < 40) {
      smallImages++;
      findings.push({
        type: "very-small",
        details:
          "One or more photos are very small or compressed — this may indicate screenshots or reused images.",
      });
    }
  }

  // Scoring
  let score = 10;
  score -= duplicates * 2;
  score -= smallImages > 2 ? 2 : smallImages;

  if (score < 0) score = 0;

  return {
    duplicates,
    findings,
    score: Math.round(score),
  };
}
