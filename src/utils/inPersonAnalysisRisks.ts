// src/utils/inPersonAnalysisRisks.ts

import type {
  ScanProgress,
  RiskItem,
  CheckAnswer,
} from "./inPersonAnalysisTypes";
import { normKey, asOneLine } from "./inPersonAnalysisHelpers";

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

  const rawNote = (id: string) => (rawChecks[id]?.note ?? "").trim();

  const includesAny = (haystack: string, needles: string[]) =>
    needles.some((n) => haystack.includes(n));

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
    if (i.severity === "major") {
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
    } else if (i.severity === "moderate") {
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
     Helper: push check-based risks
  ----------------------------- */
  const pushConcern = (opts: {
    id: string;
    label: string;
    moderateExplanation: string;
    criticalExplanation?: string;
    criticalSignals?: string[];
    defaultSeverity?: RiskItem["severity"];
  }) => {
    const {
      id,
      label,
      moderateExplanation,
      criticalExplanation,
      criticalSignals,
      defaultSeverity = "moderate",
    } = opts;

    if (effectiveChecks[id]?.value !== "concern") return;

    const nRaw = rawNote(id);
    const nKey = normKey(nRaw);

    const isCritical =
      Array.isArray(criticalSignals) &&
      criticalSignals.length > 0 &&
      includesAny(nKey, criticalSignals);

    const explanation = nRaw
      ? asOneLine(nRaw)
      : isCritical && criticalExplanation
      ? criticalExplanation
      : moderateExplanation;

    risks.push({
      id: `check-${id}`,
      label,
      explanation,
      severity: isCritical ? "critical" : defaultSeverity,
    });
  };

  /* -----------------------------
     Around the car
  ----------------------------- */
  pushConcern({
    id: "body-panels-paint",
    label: "Body panels or paint stood out",
    moderateExplanation:
      "Mismatched paint, uneven gaps, or signs of repair can affect value.",
  });

  pushConcern({
    id: "headlights-condition",
    label: "Headlights condition stood out",
    moderateExplanation:
      "Cloudy/yellow lenses, cracks, or moisture inside can reduce visibility.",
  });

  /* -----------------------------
     Windscreen
  ----------------------------- */
  const windscreenRaw = rawNote("windscreen-damage");
  const windscreenKey = normKey(windscreenRaw);

  if (effectiveChecks["windscreen-damage"]?.value === "concern") {
    const isCritical = includesAny(windscreenKey, [
      "crack",
      "driver",
      "line crack",
      "long crack",
    ]);

    risks.push({
      id: "check-windscreen-damage",
      label: "Windscreen damage recorded",
      explanation: windscreenRaw
        ? asOneLine(windscreenRaw)
        : "Windscreen damage was noted.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

  pushConcern({
    id: "tyre-wear",
    label: "Tyre wear or tread stood out",
    moderateExplanation:
      "Uneven or low tread can require near-term replacement.",
  });

  pushConcern({
    id: "brakes-visible",
    label: "Brake discs stood out",
    moderateExplanation:
      "Visible brake wear may indicate servicing is due soon.",
  });

  /* -----------------------------
     Cabin
  ----------------------------- */
  pushConcern({
    id: "interior-smell",
    label: "Interior smell or moisture stood out",
    moderateExplanation:
      "A musty or damp smell can hint at leaks or water entry.",
    criticalExplanation:
      "Signs of water ingress or mould are high-impact.",
    criticalSignals: ["mould", "mold", "water", "leak", "flood"],
  });

  pushConcern({
    id: "interior-condition",
    label: "Interior condition stood out",
    moderateExplanation:
      "Unusually rough interior wear can affect value.",
  });

  pushConcern({
    id: "seat-adjustment",
    label: "Seat adjustment or stability issue",
    moderateExplanation:
      "Seat movement or adjustment issues may require repair.",
    criticalExplanation:
      "A loose or non-functioning seat is a safety concern.",
    criticalSignals: ["loose", "rock", "not working", "stuck"],
  });

  pushConcern({
    id: "windows-operation",
    label: "Window operation issue",
    moderateExplanation:
      "Slow or noisy windows may indicate regulator wear.",
    criticalExplanation:
      "A stuck window or failed regulator can be costly.",
    criticalSignals: ["stuck", "regulator", "grinding"],
  });

  pushConcern({
    id: "mirrors-operation",
    label: "Mirror operation issue",
    moderateExplanation:
      "Mirror adjustment or stability issues were noted.",
  });

  pushConcern({
    id: "seatbelts-trim",
    label: "Seatbelt or airbag trim concern",
    moderateExplanation:
      "Seatbelt or trim issues should be clarified.",
    criticalExplanation:
      "Damaged seatbelts or airbag trim are safety issues.",
    criticalSignals: ["frayed", "airbag", "doesnt retract", "stuck"],
  });

  /* -----------------------------
     Air-conditioning
  ----------------------------- */
  const airconRaw = rawNote("aircon");
  const airconKey = normKey(airconRaw);

  if (effectiveChecks["aircon"]?.value === "concern") {
    const isCritical = includesAny(airconKey, [
      "not cooling",
      "no cold",
      "blowing hot",
      "compressor",
      "failed",
    ]);

    risks.push({
      id: "check-aircon",
      label: "Air-conditioning concern recorded",
      explanation: airconRaw
        ? asOneLine(airconRaw)
        : "Air-conditioning performance stood out.",
      severity: isCritical ? "critical" : "moderate",
    });
  }

  /* -----------------------------
     Drive checks
  ----------------------------- */
  pushConcern({
    id: "noise-hesitation",
    label: "Engine or drivetrain behaviour stood out",
    moderateExplanation:
      "Unusual noises or hesitation during driving were noted.",
    defaultSeverity: "critical",
  });

  pushConcern({
    id: "steering",
    label: "Steering or handling concern",
    moderateExplanation:
      "Steering feel or handling issues may indicate alignment or suspension problems.",
    defaultSeverity: "critical",
  });

  pushConcern({
    id: "adas-systems",
    label: "Driver-assist systems concern",
    moderateExplanation:
      "Driver-assist systems may not be behaving as expected.",
  });

  pushConcern({
    id: "underbody-leaks",
    label: "Possible fluid leak noticed",
    moderateExplanation:
      "Fluid marks or leaks should be investigated before purchase.",
    defaultSeverity: "critical",
  });

  return risks;
}
