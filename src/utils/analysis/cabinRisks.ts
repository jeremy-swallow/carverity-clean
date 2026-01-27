// src/utils/analysis/cabinRisks.ts

import type { CheckAnswer, RiskItem } from "../inPersonAnalysis";

/**
 * Cabin-only risk assessment.
 * IMPORTANT:
 * - Does NOT generate critical risks
 * - Does NOT create risk entries for "unsure"
 * - Only reacts to explicit "concern"
 */

type CabinCheckId =
  | "seat-adjustment"
  | "windows-mirrors";

export function assessCabinRisks(args: {
  checks: Record<CabinCheckId | string, CheckAnswer>;
}): RiskItem[] {
  const { checks } = args;
  const risks: RiskItem[] = [];

  /* ---------------------------------
     Seat adjustment & stability
  --------------------------------- */
  const seat = checks["seat-adjustment"];
  if (seat?.value === "concern") {
    risks.push({
      id: "check-seat-adjustment",
      label: "Seat adjustment or stability concern",
      explanation: seat.note?.trim()
        ? `Seat movement or adjustment stood out — ${seat.note.trim()}.`
        : "Seat movement or adjustment stood out. A loose or unstable seat can affect driving comfort and control.",
      severity: "moderate",
    });
  }

  /* ---------------------------------
     Windows & mirrors
  --------------------------------- */
  const windows = checks["windows-mirrors"];
  if (windows?.value === "concern") {
    risks.push({
      id: "check-windows-mirrors",
      label: "Windows or mirrors not functioning normally",
      explanation: windows.note?.trim()
        ? `Windows or mirrors didn’t behave as expected — ${windows.note.trim()}.`
        : "Windows or mirrors didn’t behave as expected. Electrical or mechanical issues here can affect daily usability.",
      severity: "moderate",
    });
  }

  return risks;
}
