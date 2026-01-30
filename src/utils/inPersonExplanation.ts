/* =========================================================
   In-person inspection — deterministic explanation builder

   PURPOSE
   -------
   This file converts an in-person inspection analysis result
   into clear, buyer-safe human language.

   IMPORTANT DESIGN RULES
   ----------------------
   • This file does NOT call AI.
   • This file NEVER returns null.
   • This file NEVER invents facts.
   • Output is safe to show even if AI fails.
   • Output is structured so AI can rewrite it later.

   AI STRATEGY
   -----------
   In v1, this output is shown directly.
   In v1.1+, AI may REWRITE this text, not replace logic.

   ========================================================= */

export type ExplanationSection = {
  title: string;
  body: string;
};

export type DeterministicExplanation = {
  headline: string;
  verdictKey: "proceed" | "caution" | "walk-away";
  sections: ExplanationSection[];
  nextBestAction: string;
};

/* =========================================================
   Helpers
========================================================= */

function safeNumber(n: any, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function plural(n: number, word: string) {
  return n === 1 ? word : `${word}s`;
}

/* =========================================================
   Main builder
========================================================= */

export function buildInPersonExplanation(
  analysis: any
): DeterministicExplanation {
  const verdict: "proceed" | "caution" | "walk-away" =
    analysis?.verdict === "walk-away" ||
    analysis?.verdict === "caution" ||
    analysis?.verdict === "proceed"
      ? analysis.verdict
      : "caution";

  const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
  const criticalCount = risks.filter(
    (r: any) => r?.severity === "critical"
  ).length;
  const moderateCount = risks.filter(
    (r: any) => r?.severity === "moderate"
  ).length;

  const uncertaintyCount = safeNumber(
    analysis?.uncertaintyFactors?.length,
    0
  );

  const confidenceScore = safeNumber(analysis?.confidenceScore, 0);

  /* -------------------------------------------------------
     Headline
  ------------------------------------------------------- */

  const headline =
    verdict === "proceed"
      ? "Overall, nothing you recorded strongly contradicts moving forward"
      : verdict === "walk-away"
      ? "Based on what you recorded, this vehicle carries significant risk"
      : "Your inspection shows some meaningful points that deserve caution";

  /* -------------------------------------------------------
     Section: What influenced this result
  ------------------------------------------------------- */

  const influenceLines: string[] = [];

  if (criticalCount > 0) {
    influenceLines.push(
      `You recorded ${criticalCount} ${plural(
        criticalCount,
        "issue"
      )} assessed as high impact. Items in this category materially affect risk.`
    );
  }

  if (moderateCount > 0) {
    influenceLines.push(
      `You recorded ${moderateCount} ${plural(
        moderateCount,
        "issue"
      )} that may indicate wear, developing faults, or future cost.`
    );
  }

  if (uncertaintyCount > 0) {
    influenceLines.push(
      `There ${
        uncertaintyCount === 1 ? "is" : "are"
      } ${uncertaintyCount} ${plural(
        uncertaintyCount,
        "item"
      )} you marked as unsure. These are treated as unknowns, not positives or negatives.`
    );
  }

  if (influenceLines.length === 0) {
    influenceLines.push(
      "You did not record any significant concerns or unresolved uncertainties during the inspection."
    );
  }

  /* -------------------------------------------------------
     Section: How to interpret the score
  ------------------------------------------------------- */

  const scoreInterpretation =
    confidenceScore >= 85
      ? "Your recorded answers suggest relatively low observed risk based on what was checked."
      : confidenceScore >= 70
      ? "Your inspection contains a mix of reassuring signs and items worth clarifying."
      : confidenceScore >= 55
      ? "Several recorded items reduce confidence and should be considered carefully."
      : "Your inspection highlights multiple risk signals that significantly reduce confidence.";

  /* -------------------------------------------------------
     Section: Buyer-safe framing
  ------------------------------------------------------- */

  const buyerSafeText =
    "CarVerity does not assume anything you did not record. Items left unchecked or marked as unsure are treated as questions to resolve, not automatic faults.";

  /* -------------------------------------------------------
     Next best action
  ------------------------------------------------------- */

  let nextBestAction = "Clarify the most important unresolved item before deciding how to proceed.";

  if (criticalCount > 0) {
    nextBestAction =
      "Resolve the highest-impact issue you recorded with written evidence or professional inspection.";
  } else if (uncertaintyCount > 0) {
    nextBestAction =
      "Focus on confirming the most important item you marked as unsure before committing.";
  } else if (verdict === "proceed") {
    nextBestAction =
      "Confirm service history and ownership details to finalise your decision with confidence.";
  }

  /* -------------------------------------------------------
     Assemble explanation
  ------------------------------------------------------- */

  return {
    headline,
    verdictKey: verdict,
    sections: [
      {
        title: "What influenced this assessment",
        body: influenceLines.join(" "),
      },
      {
        title: "How to interpret your inspection score",
        body: scoreInterpretation,
      },
      {
        title: "Buyer-safe logic",
        body: buyerSafeText,
      },
    ],
    nextBestAction,
  };
}
