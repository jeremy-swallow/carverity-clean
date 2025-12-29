/* src/utils/photoTransparency.ts */

export interface PhotoTransparencyResult {
  score: number;
  summary: string;
}

/**
 * Accepts an array of photo URLs / base64 strings
 * and produces a transparency score based on count + variety.
 */
export function calculatePhotoTransparency(
  photos: string[]
): PhotoTransparencyResult {
  const count = photos.length;

  if (count === 0) {
    return {
      score: 0,
      summary: "No photos provided — transparency cannot be assessed.",
    };
  }

  if (count <= 3) {
    return {
      score: 3,
      summary: "Limited photo coverage — key angles may be missing.",
    };
  }

  if (count <= 6) {
    return {
      score: 5,
      summary: "Photo coverage is reasonable but could be better.",
    };
  }

  if (count <= 12) {
    return {
      score: 8,
      summary: "Good photo coverage across major viewing angles.",
    };
  }

  return {
    score: 10,
    summary: "Excellent and comprehensive photo coverage.",
  };
}
