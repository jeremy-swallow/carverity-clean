// src/utils/inPersonAnalysisRisks.ts

import type {
  ScanProgress,
  RiskItem,
  CheckAnswer,
} from "./inPersonAnalysisTypes";
import {
  normKey,
  asOneLine,
  hasNote,
  severityWeight,
} from "./inPersonAnalysisHelpers";

/* =========================================================
   Risk builder
========================================================= */

export function buildRisks(args: {
  rawChecks: Record<string, CheckAnswer>;
  effectiveChecks: Record<string, CheckAnswer>;
  imperfections: NonNullable<ScanProgress["imperfections"]>;
  photosCapturedBaseline: number;
  requiredPhotoCount: number;
}): RiskItem[] {
  const {
    rawChecks,
    effectiveChecks,
    imperfections,
    photosCapturedBaseline,
    requiredPhotoCount,
  } = args;

  const risks: RiskItem[] = [];

  /* -----------------------------
     Photo coverage
  ----------------------------- */
  if (photosCapturedBaseline < requiredPhotoCount) {
    risks.push({
      id: "missing-photos",
      label: "Some baseline exterior photos are missing",
      explanation:
        "Not all exterior angles were captured. This reduces how confidently the report can reflect what was observed.",
      severity: "moderate",
    });
  }

  /* -----------------------------
     Imperfections
  ----------------------------- */
  imperfections.forEach((i) => {
    const weight = severityWeight(i.severity);

    if (weight >= 3) {
      risks.push({
        id: `imp-${i.id}`,
        label: i.label
          ? `Major observation: ${i.label}`
          : "Major observation recorded",
        explanation:
          i.note ||
          "A major observation was recorded. Clarify details and pricing impact before proceeding.",
        severity: "critical",
      });
    } else if (weight === 2) {
      risks.push({
        id: `imp-${i.id}`,
        label: i.label
          ? `Observation: ${i.label}`
          : "Moderate observation recorded",
        explanation:
          i.note ||
          "A moderate observation was recorded. It may influence negotiation depending on severity and buyer preference.",
        severity: "moderate",
      });
    }
  });

  /* -----------------------------
     Helper to push check-based risks
  ----------------------------- */
  const pushConcern = (
    id: string,
    label: string,
    explanation: string,
    severity: RiskItem["severity"]
  ) => {
    if (effectiveChecks[id]?.value === "concern") {
      risks.push({
        id: `check-${id}`,
        label,
        explanation,
        severity,
      });
    }
  };

  /* -----------------------------
     Headlights
  ----------------------------- */
  pushConcern(
    "headlights-condition",
    "Headlights condition stood out",
    "Cloudy/yellow headlights, cracks, or moisture inside can reduce night visibility and may require restoration or replacement.",
    "moderate"
  );

  /* -----------------------------
     Windscreen (note-sensitive)
  ----------------------------- */
  const windscreenRawNote = (rawChecks["windscreen-damage"]?.note ?? "").trim();
  const windscreenNote = normKey(windscreenRawNote);

  if (effectiveChecks["windscreen-damage"]?.value === "concern") {
    const isCritical =
      hasNote(windscreenRawNote) &&
      ["crack", "driver view", "drivers view", "line crack"].some((s) =>
        windscreenNote.includes(s)
      );

    risks.push({
      id: "check-windscreen-damage",
      label: "Windscreen damage recorded",
      explanation: isCritical
        ? "A crack or damage in the driver’s view can be a safety issue and may require replacement."
        : "Windscreen chips can spread and become more expensive to fix.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

  /* -----------------------------
     Air-conditioning
  ----------------------------- */
  const airconRawNote = (rawChecks["aircon"]?.note ?? "").trim();
  const airconNote = normKey(airconRawNote);

  if (effectiveChecks["aircon"]?.value === "concern") {
    const isCritical =
      hasNote(airconRawNote) &&
      [
        "no cooling",
        "not cooling",
        "blowing hot",
        "compressor",
        "not working",
      ].some((s) => airconNote.includes(s));

    risks.push({
      id: "check-aircon",
      label: "Air-conditioning concern recorded",
      explanation: airconRawNote
        ? asOneLine(airconRawNote)
        : "Air-conditioning behaviour stood out during use.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

  /* -----------------------------
     Drive behaviour
  ----------------------------- */
  pushConcern(
    "noise-hesitation",
    "Engine or drivetrain behaviour stood out",
    "Unusual hesitation or noises during driving may indicate underlying mechanical issues.",
    "critical"
  );

  pushConcern(
    "steering",
    "Steering or handling concern",
    "If steering feel or handling stood out, alignment or suspension issues may be present.",
    "critical"
  );

  pushConcern(
    "adas-systems",
    "Driver-assist systems may not be behaving predictably",
    "Driver-assist systems should operate consistently with no warnings.",
    "moderate"
  );

  /* -----------------------------
     Legacy compatibility
  ----------------------------- */
  pushConcern(
    "underbody-leaks",
    "Possible fluid leak was noticed",
    "Any visible fluid leak should be clarified before proceeding.",
    "critical"
  );

  return risks;
}
