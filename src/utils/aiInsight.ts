import type { AIScanInsight, ScanType } from "./scanStorage";

export function generateAIScanInsight(
  type: ScanType,
  concern?: string
): AIScanInsight {
  if (type === "online") {
    return {
      summary:
        "This listing appears generally consistent, but there are a few areas worth verifying in person before committing.",
      focusPoints: [
        "Details missing or glossed over in the description",
        "Photos that don’t clearly show wear-prone areas",
        "Signals that suggest asking targeted follow-up questions",
      ],
      confidence: concern ? "medium" : "low",
    };
  }

  // In-person inspections
  return {
    summary:
      "This in-person inspection focused on visible condition and immediate risk signals that are difficult to judge from a listing alone.",
    focusPoints: [
      "Overall condition relative to age and usage",
      "Signs of neglect, rushed preparation, or cosmetic masking",
      "Anything that would justify a professional inspection",
    ],
    confidence: "high",
  };
}
