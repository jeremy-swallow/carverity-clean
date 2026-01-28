// src/pages/inPersonResults/copy.ts

/* =======================================================
   In-Person Results Copy / Strings
   - Central source of truth for all user-facing text
   - No logic, no JSX
======================================================= */

export const RESULTS_COPY = {
  /* -----------------------------
     Global / header
  ----------------------------- */
  brandLine: "CarVerity · Your report",
  headerScanIdLabel: "Scan ID:",
  headerDateLabel: "Date:",
  headerAskingPriceLabel: "Asking price:",

  /* -----------------------------
     Loading / errors / recovery
  ----------------------------- */
  verifyingUnlock: "Verifying unlock…",
  unlockVerifyFailed: "Could not verify unlock status.",
  retry: "Retry",
  rebuildingReport: "Rebuilding your report…",
  retryAnalysis: "Retry analysis",

  /* -----------------------------
     Primary CTA
  ----------------------------- */
  pricePositioningTitle: "Price positioning & negotiation",
  pricePositioningSubtitle:
    "Your offer range + how to ask (even if the car looks clean).",
  pricePositioningHelper:
    "This is the most valuable part of the report if you’re buying from a dealer.",

  /* -----------------------------
     Verdict section
  ----------------------------- */
  whatStoodOutTitle: "What stood out (from your inspection)",

  /* -----------------------------
     Score pills
  ----------------------------- */
  scoreConfidenceLabel: "Confidence",
  scoreConfidenceSub:
    "How strongly the result is supported by what you recorded.",
  scoreCoverageLabel: "Coverage",
  scoreCoverageSub: "How much of the inspection flow you completed.",
  scoreConcernsLabel: "Concerns",
  scoreConcernsSub: "Items you marked as stood out or needing attention.",
  scoreUnsureLabel: "Unsure",
  scoreUnsureSub: "Unknowns that should be confirmed before buying.",

  /* -----------------------------
     Accordion: Why this score
  ----------------------------- */
  whyThisScoreTitle: "Why this score?",
  whyThisScoreSubtitle:
    "A clear explanation of how CarVerity arrived at this result.",
  whyScoreCard1Title: "Confidence is not a guess",
  whyScoreCard1Body:
    "Confidence increases when you record clear observations. It drops when there are unknowns or unanswered items.",
  whyScoreCard2Title: "Coverage drives reliability",
  whyScoreCard2Body:
    "Higher coverage means the result is based on more checks. Low coverage makes the outcome more cautious.",
  whyScoreCard3Title: "Concerns & unsure items matter",
  whyScoreCard3Body:
    "Concerns raise risk. Unsure items are treated as unknowns — they should be clarified before committing.",
  whatYouRecordedSummaryLabel: "What you recorded (summary)",
  snapshotLabel: "Snapshot",
  snapshotPhotos: "Photos",
  snapshotFlagged: "Flagged items",
  snapshotUnsure: "Unsure",
  snapshotCoverage: "Coverage",
  noAssumptionsFooter:
    "CarVerity does not assume anything you didn’t check. If it wasn’t recorded, it’s treated as unknown — not good or bad.",

  /* -----------------------------
     Accordion: Confidence explained
  ----------------------------- */
  confidenceExplainedTitle: "Confidence explained",
  confidenceExplainedSubtitle:
    "What it means, what affects it, and how to improve it.",
  confCard1Title: "What confidence means",
  confCard1Body:
    "Confidence is how strongly this result is supported by what you actually recorded. It is not a promise the car is “good”.",
  confCard2Title: "What affects it",
  confCard2Body:
    "It goes up with more checks, clearer notes, and photos. It goes down when there are unknowns, missing steps, or unsure items.",
  confCard3Title: "How to improve it",
  confCard3Body:
    "Confirm unsure items, add short notes, and capture proof photos (dash lights, tyres, service stickers, damage close-ups).",
  practicalTipsLabel: "Practical tips (fast)",
  practicalTip1Bold: "Turn “unsure” into “confirmed”",
  practicalTip1Body:
    "by asking for proof (invoice, photo, written confirmation).",
  practicalTip2Bold: "Add one sentence notes",
  practicalTip2Body: "on anything you flagged (what you saw, heard, or felt).",
  practicalTip3Bold: "Capture proof photos",
  practicalTip3Body: "that someone else can understand later.",
  confidenceFooter:
    "Confidence is about evidence quality — not optimism. A lower confidence score is still useful because it tells you what to clarify before you commit.",

  /* -----------------------------
     Clean scan value (never empty)
  ----------------------------- */
  cleanScanValueTitle: "Why this is still valuable (even on a clean scan)",
  cleanScanCard1Title: "You captured a buyer-proof record",
  cleanScanCard1Body:
    "This report documents what was checked today. That alone reduces “unknowns” — and helps you avoid paying full sticker price without evidence.",
  cleanScanCard2Title: "You can still negotiate on a clean car",
  cleanScanCard2Body:
    "Dealers often price expecting negotiation. If the car looks clean, you negotiate on readiness to buy + market norms (not faults).",
  cleanScanCard3Title: "You now have a clear next step",
  cleanScanCard3Body:
    "If you’re close to buying, a pre-purchase inspection is the final risk-reducer. If you’re not close yet, compare this report against other cars.",

  /* -----------------------------
     What you flagged section
  ----------------------------- */
  flaggedTitle: "What you flagged",
  flaggedChecksLabel: "Checks (concerns + unsure)",
  flaggedNoChecks:
    "You didn’t flag any check items as “stood out” or “unsure”.",
  flaggedNoNotes: "No notes added.",
  flaggedTagConcern: "Stood out",
  flaggedTagUnsure: "Couldn’t confirm",
  flaggedImperfectionsLabel: "Imperfections",
  flaggedNoImperfections: "No imperfections were recorded.",
  flaggedLocationPrefix: "Location:",
  flaggedLocationEmpty: "Location: —",
  flaggedEvidenceFooter:
    "This section is the exact list of what you recorded — nothing is inferred.",

  /* -----------------------------
     What to do next section
  ----------------------------- */
  nextTitle: "What to do next",
  nextIntro: "This is a simple plan based only on what you recorded today.",
  openDecisionGuide: "Open decision guide",

  /* -----------------------------
     Seller questions section
  ----------------------------- */
  questionsTitle: "Questions to ask the seller",
  questionsIntro: "Keep it simple. You’re just trying to get clear answers.",

  /* -----------------------------
     Risks sections
  ----------------------------- */
  biggestConcernsTitle: "Biggest concerns",
  worthCheckingTitle: "Things worth checking",

  /* -----------------------------
     Unsure section
  ----------------------------- */
  unsureTitle: "Things you weren’t sure about",
  unsureFooter:
    "“Unsure” just means you couldn’t confirm it today. If it matters, try to verify it before buying.",

  /* -----------------------------
     Evidence considered
  ----------------------------- */
  evidenceConsideredTitle: "Evidence considered",
  recordedNotesLabel: "Recorded notes",
  notesOnInterpretationLabel: "Notes on interpretation",

  /* -----------------------------
     Photos section
  ----------------------------- */
  photosTitle: "Photos",
  photosLoading: "Loading photos…",
  photosShowingPrefix: "Showing",
  photosOf: "of",
  photosCapturedSuffix: "captured photo",
  photosCapturedSuffixPlural: "captured photos",
  photosExistsButNotLoaded:
    "Photos exist, but they could not be loaded right now. Please check your connection and refresh.",
  photosNone: "You didn’t take any photos during this inspection.",

  /* -----------------------------
     Finish / share section
  ----------------------------- */
  finishTitle: "Finished — save or share this report",
  finishBody:
    "If you want to share this with someone (partner, family, mechanic), the easiest way is to save it as a PDF, then email it from your own email app.",
  finishPrint: "Print / Save as PDF",
  finishEmail: "Email this report",
  finishNewScan: "Start a new scan",

  /* -----------------------------
     Bottom primary buttons
  ----------------------------- */
  bottomDecision: "Decision & next steps",
  bottomPrint: "Print / save report",
  bottomNewScan: "Start a new scan",

  /* -----------------------------
     Email helper
  ----------------------------- */
  emailSubjectPrefix: "CarVerity report",
  emailGreeting: "Hi,",
  emailIntro: "Here is my CarVerity in-person inspection summary.",
  emailVehicle: "Vehicle:",
  emailScanId: "Scan ID:",
  emailDate: "Date:",
  emailAskingPrice: "Asking price:",
  emailSummaryLabel: "Summary:",
  emailResult: "• Result:",
  emailConfidence: "• Confidence:",
  emailCoverage: "• Coverage:",
  emailConcerns: "• Concerns recorded:",
  emailUnsure: "• Unsure items:",
  emailPhotos: "• Photos captured:",
  emailTip:
    "Tip: You can print/save the PDF and attach it to this email.",
  emailSignature: "— Sent from CarVerity",
} as const;

/* =======================================================
   Tiny copy builders (string-only helpers)
======================================================= */

/**
 * Build the score blurb copy from scores.
 * Kept here so the UI doesn’t hardcode strings.
 */
export function scoreBlurbCopy(scores: {
  confidence: number;
  coverage: number;
}): string {
  const { confidence, coverage } = scores;

  if (coverage < 40) {
    return "You didn’t record much, so this result is cautious. It can still help — but check more before you decide.";
  }
  if (confidence < 45) {
    return "Some things need checking. Use the questions below to get clearer answers.";
  }
  return "This is based only on what you recorded. It doesn’t assume anything you didn’t check.";
}

/**
 * Build the Evidence headline sentence.
 * Kept in copy so wording stays consistent.
 */
export function buildEvidenceHeadlineCopy(params: {
  concernCount: number;
  imperfectionCount: number;
  capturedPhotoCount: number;
}): string {
  const { concernCount, imperfectionCount, capturedPhotoCount } = params;

  const parts: string[] = [];

  if (concernCount > 0) {
    parts.push(`${concernCount} flagged item${concernCount === 1 ? "" : "s"}`);
  }

  if (imperfectionCount > 0) {
    parts.push(
      `${imperfectionCount} imperfection${imperfectionCount === 1 ? "" : "s"}`
    );
  }

  if (capturedPhotoCount > 0) {
    parts.push(
      `${capturedPhotoCount} photo${capturedPhotoCount === 1 ? "" : "s"}`
    );
  }

  if (parts.length === 0) {
    return "This report is based on the information recorded during your inspection.";
  }

  return `This report was generated from ${parts.join(
    ", "
  )} recorded during your inspection.`;
}

/**
 * Evidence interpretation notes (bullet list) — string-only.
 */
export function buildEvidenceNotesCopy(params: {
  hasUnsure: boolean;
}): string[] {
  const lines: string[] = [];

  lines.push(
    "Only items you recorded are used. If something wasn’t checked, it’s treated as not recorded — not as good or bad."
  );

  if (params.hasUnsure) {
    lines.push(
      "Items marked as unsure are treated as unknown and included in the overall risk posture."
    );
  }

  lines.push(
    "This is not a mechanical certification. If you’re close to buying, consider an independent pre-purchase inspection."
  );

  return lines;
}
