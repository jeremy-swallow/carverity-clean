// src/utils/aiInsights.ts
import type { ScanType } from "./scanStorage";

export type VehicleContext = {
  make?: string;
  model?: string;
  year?: string | number;
  isImport?: boolean;
};

export type AIScanInsight = {
  summary: string;
  focusPoints: string[];
  confidence: "low" | "medium" | "high";
};

function hasEnoughImportContext(v: VehicleContext): boolean {
  return Boolean(v?.isImport && v?.make && v?.model);
}

export function generateAIScanInsight(
  type: ScanType,
  concern?: string,
  vehicle?: VehicleContext
): AIScanInsight {
  // 🌏 ONLINE LISTING ANALYSIS
  if (type === "online") {
    const baseInsight: AIScanInsight = {
      summary:
        "This listing appears generally consistent, but there are a few areas worth verifying in person before committing.",
      focusPoints: [
        "Details missing or glossed over in the description",
        "Photos that don’t clearly show wear-prone areas",
        "Signals that suggest asking targeted follow-up questions",
      ],
      confidence: concern ? "medium" : "low",
    };

    // 🚗 Conditional import-parts guidance
    if (vehicle && hasEnoughImportContext(vehicle)) {
      const label = [
        vehicle.year,
        vehicle.make,
        vehicle.model,
      ]
        .filter(Boolean)
        .join(" ");

      baseInsight.focusPoints.push(
        `Because this appears to be an imported ${label}, some replacement parts may be harder to source locally and may cost more or take longer to obtain. If the car interests you, ask the seller about servicing history and parts availability for this model.`
      );
    }

    return baseInsight;
  }

  // 👟 IN-PERSON INSPECTION
  return {
    summary:
      "This in-person inspection focused on visible condition and immediate risk signals that are difficult to judge from a listing alone.",
    focusPoints: [
      "Overall condition relative to age and usage",
      "Signs of neglect or cosmetic masking",
      "Whether a professional mechanical inspection is justified",
    ],
    confidence: "high",
  };
}
