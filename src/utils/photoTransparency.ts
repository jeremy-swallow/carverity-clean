export type PhotoCategory =
  | "exterior"
  | "interior"
  | "dash"
  | "engine"
  | "wheels"
  | "damage"
  | "unknown";

export type ListingPhoto = {
  url: string;
  category?: PhotoCategory;
  hash?: string; // reused / duplicate detection
};

export type PhotoTransparencyCounts = {
  total: number;
  exterior: number;
  interior: number;
  dash: number;
  engine: number;
  wheels: number;
  damage: number;
};

export type PhotoTransparencyResult = {
  score: number;
  grade: "poor" | "fair" | "good" | "excellent";
  summary: string;
  counts: PhotoTransparencyCounts;
  missing: string[];
  reusedPhotos: string[];
  recommendations: string[];
};

function detectDuplicateHashes(photos: ListingPhoto[]): string[] {
  const seen = new Map<string, number>();
  const reused: string[] = [];

  for (const p of photos) {
    if (!p.hash) continue;
    const count = seen.get(p.hash) ?? 0;
    seen.set(p.hash, count + 1);
    if (count > 0) reused.push(p.url);
  }

  return reused;
}

export function calculatePhotoTransparency(
  photos: ListingPhoto[]
): PhotoTransparencyResult {
  const counts: PhotoTransparencyCounts = {
    total: photos.length,
    exterior: 0,
    interior: 0,
    dash: 0,
    engine: 0,
    wheels: 0,
    damage: 0,
  };

  for (const p of photos) {
    switch (p.category) {
      case "exterior":
        counts.exterior++;
        break;
      case "interior":
        counts.interior++;
        break;
      case "dash":
        counts.dash++;
        break;
      case "engine":
        counts.engine++;
        break;
      case "wheels":
        counts.wheels++;
        break;
      case "damage":
        counts.damage++;
        break;
      default:
        break;
    }
  }

  const missing: string[] = [];
  if (counts.exterior < 3) missing.push("More exterior angles recommended");
  if (counts.interior < 2) missing.push("Interior seating / trim photos missing");
  if (counts.dash < 1) missing.push("Dashboard / odometer photo missing");
  if (counts.engine < 1) missing.push("No engine bay photo");
  if (counts.wheels < 1) missing.push("No wheel / tyre photos");
  if (counts.damage < 1) missing.push("No close-ups of wear or damage areas");

  const reusedPhotos = detectDuplicateHashes(photos);

  let score = 50;
  score += counts.exterior * 6;
  score += counts.interior * 4;
  score += counts.engine * 4;
  score -= reusedPhotos.length * 6;

  score = Math.max(0, Math.min(100, score));

  const grade =
    score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor";

  const recommendations: string[] = [];

  if (reusedPhotos.length > 0)
    recommendations.push(
      "Ask the seller for new photos — some images appear reused or duplicated."
    );

  if (missing.length > 0)
    recommendations.push(
      "Request the missing photo areas before travelling to inspect the car."
    );

  return {
    score,
    grade,
    summary:
      grade === "excellent"
        ? "Strong visual transparency — good confidence in listing accuracy."
        : grade === "good"
        ? "Most key photo areas are covered — reasonable transparency."
        : grade === "fair"
        ? "Limited photo coverage — recommended to request more images."
        : "Very limited or repeated photos — strong caution advised.",

    counts,
    missing,
    reusedPhotos,
    recommendations,
  };
}
