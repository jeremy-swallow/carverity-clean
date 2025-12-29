/* src/utils/photoTransparency.ts */

export interface PhotoTransparencyResult {
  score: number;
  summary: string;
  recommendations: string[];
}

/**
 * Input is now an array of base64 image strings
 */
export function calculatePhotoTransparency(
  photos: string[]
): PhotoTransparencyResult {
  if (!Array.isArray(photos) || photos.length === 0) {
    return {
      score: 0,
      summary: "No listing photos were provided.",
      recommendations: ["Ask the seller for more photos before proceeding."]
    };
  }

  let score = 5;

  // Simple heuristics we can improve later
  if (photos.length >= 6) score += 2;
  if (photos.length >= 10) score += 1;

  // Penalise tiny / low–resolution images
  const smallImages = photos.filter(p => p.length < 40_000).length;
  if (smallImages > 0) score -= 2;

  score = Math.max(0, Math.min(score, 10));

  return {
    score,
    summary:
      score >= 8
        ? "This listing includes a strong set of photos."
        : score >= 5
        ? "Photo coverage is reasonable but could be better."
        : "This listing provides limited or low-quality photo coverage.",
    recommendations: [
      "Request photos showing all sides of the vehicle.",
      "Ask for close-ups of wear, wheels and engine bay.",
      "Request photos of logbook and odometer where possible."
    ]
  };
}
