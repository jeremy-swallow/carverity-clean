/* src/utils/photoTransparency.ts */

export interface PhotoTransparencyResult {
  score: number;
  summary: string;
}

export function calculatePhotoTransparency(photos: string[]): PhotoTransparencyResult {
  const count = Array.isArray(photos) ? photos.length : 0;

  if (count === 0) {
    return {
      score: 2,
      summary: "No photos supplied — extremely high risk.",
    };
  }

  if (count <= 2) {
    return {
      score: 3,
      summary: "Very limited photo coverage — key angles are missing.",
    };
  }

  if (count <= 4) {
    return {
      score: 5,
      summary: "Basic coverage — only some key angles visible.",
    };
  }

  if (count <= 6) {
    return {
      score: 7,
      summary: "Good coverage — most key angles are provided.",
    };
  }

  // 7–8 photos (maximum supported)
  return {
    score: 9,
    summary: "Strong photo coverage with good transparency.",
  };
}
