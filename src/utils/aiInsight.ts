import type { ScanType } from "./scanStorage";

export type AIScanInsight = {
  summary: string;
  focusPoints: string[];
  confidence: "low" | "medium" | "high";
};

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

  return {
    summary:
      "This in-person inspection focused on visible condition and immediate risk signals that are difficult to judge from a listing alone.",
    focusPoints: [
      "Overall condition relative to age and usage",
      "Signs of neglect or cosmetic masking",
      "Whether a professional inspection is justified",
    ],
    confidence: "high",
  };
}
