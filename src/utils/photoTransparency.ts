// src/utils/photoTransparency.ts

export type PhotoMeta = {
  url?: string;
  label?: string;
};

export type PhotoTransparencyResult = {
  score: number;
  grade: "low" | "medium" | "high";
  summary: string;
  missing: string[];
  counts: {
    total: number;
    exterior: number;
    interior: number;
    engine: number;
    dash: number;
    unknown: number;
  };
};

const EXTERIOR_HINTS = [
  "front",
  "rear",
  "side",
  "left",
  "right",
  "exterior",
  "body",
];

const INTERIOR_HINTS = ["interior", "seat", "cabin", "inside"];

const ENGINE_HINTS = ["engine", "bay", "motor"];

const DASH_HINTS = ["dash", "cluster", "odo", "odometer", "speedo"];

/**
 * Basic heuristic scoring (MVP)
 * Later this can be upgraded to AI / vision analysis
 */
export function calculatePhotoTransparency(
  photos: PhotoMeta[] = []
): PhotoTransparencyResult {
  if (!Array.isArray(photos) || photos.length === 0) {
    return {
      score: 0,
      grade: "low",
      summary: "No photos were provided with this listing.",
      missing: ["Most key photo angles are unavailable"],
      counts: {
        total: 0,
        exterior: 0,
        interior: 0,
        engine: 0,
        dash: 0,
        unknown: 0,
      },
    };
  }

  let exterior = 0;
  let interior = 0;
  let engine = 0;
  let dash = 0;
  let unknown = 0;

  for (const p of photos) {
    const text = (p?.label ?? "").toLowerCase();

    if (EXTERIOR_HINTS.some(k => text.includes(k))) exterior++;
    else if (INTERIOR_HINTS.some(k => text.includes(k))) interior++;
    else if (ENGINE_HINTS.some(k => text.includes(k))) engine++;
    else if (DASH_HINTS.some(k => text.includes(k))) dash++;
    else unknown++;
  }

  // ---- scoring heuristic ----
  let score = 20; // baseline

  if (photos.length >= 4) score += 15;
  if (photos.length >= 8) score += 20;

  if (exterior >= 3) score += 15;
  if (interior >= 2) score += 10;
  if (dash >= 1) score += 5;
  if (engine >= 1) score += 5;

  score = Math.min(score, 100);

  const missing: string[] = [];
  if (exterior < 3) missing.push("Not enough exterior coverage");
  if (interior < 2) missing.push("Few or no interior photos");
  if (dash < 1) missing.push("No dashboard / odometer photo");
  if (engine < 1) missing.push("No engine bay photo");

  let grade: "low" | "medium" | "high" = "low";
  if (score >= 70) grade = "high";
  else if (score >= 40) grade = "medium";

  const summary =
    grade === "high"
      ? "This listing provides strong visual transparency."
      : grade === "medium"
      ? "This listing includes some helpful photos, but coverage is incomplete."
      : "Very limited photo coverage — you may be missing important details.";

  return {
    score,
    grade,
    summary,
    missing,
    counts: {
      total: photos.length,
      exterior,
      interior,
      engine,
      dash,
      unknown,
    },
  };
}
