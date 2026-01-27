// src/utils/inPersonAnalysisEvidence.ts

import type {
  ScanProgress,
  EvidenceSummary,
  CheckAnswer,
} from "./inPersonAnalysisTypes";
import {
  labelForCheckId,
  asOneLine,
  severityWeight,
} from "./inPersonAnalysisHelpers";

/* =========================================================
   Evidence bullets
========================================================= */

export function buildEvidenceBullets(args: {
  rawChecks: Record<string, CheckAnswer>;
  imperfections: NonNullable<ScanProgress["imperfections"]>;
  photos: NonNullable<ScanProgress["photos"]>;
  followUps: NonNullable<ScanProgress["followUpPhotos"]>;
}): string[] {
  const { rawChecks, imperfections, photos, followUps } = args;

  const bullets: string[] = [];

  /* -----------------------------
     Checks (only what user touched)
  ----------------------------- */
  const answered = Object.entries(rawChecks)
    .filter(([, v]) => Boolean(v?.value))
    .map(([id, v]) => ({ id, v }));

  const rank = (val: "ok" | "concern" | "unsure") =>
    val === "concern" ? 0 : val === "unsure" ? 1 : 2;

  answered.sort((a, b) => rank(a.v.value) - rank(b.v.value));

  for (const { id, v } of answered) {
    const label = labelForCheckId(id);
    const note = (v.note ?? "").trim();

    if (v.value === "concern") {
      bullets.push(
        note
          ? `${label}: something stood out — ${asOneLine(note)}.`
          : `${label}: something stood out.`
      );
    }

    if (v.value === "unsure") {
      bullets.push(
        note
          ? `${label}: couldn’t confirm — ${asOneLine(note)}.`
          : `${label}: couldn’t confirm.`
      );
    }
  }

  /* -----------------------------
     Imperfections (deduped upstream)
  ----------------------------- */
  const sortedImperfections = [...imperfections].sort((a, b) => {
    return severityWeight(b.severity) - severityWeight(a.severity);
  });

  for (const imp of sortedImperfections) {
    const sev =
      imp.severity === "major"
        ? "Major"
        : imp.severity === "moderate"
        ? "Moderate"
        : "Minor";

    const label = (imp.label ?? "Imperfection").trim();
    const loc = (imp.location ?? "").trim();
    const note = (imp.note ?? "").trim();

    const locPart = loc ? ` (${loc})` : "";

    bullets.push(
      note
        ? `${sev} note: ${label}${locPart} — ${asOneLine(note)}.`
        : `${sev} note: ${label}${locPart}.`
    );
  }

  /* -----------------------------
     Photos & follow-ups
  ----------------------------- */
  if (photos.length > 0) {
    bullets.push(`Photos captured: ${photos.length}.`);
  }

  if (followUps.length > 0) {
    bullets.push(`Follow-up notes/photos: ${followUps.length}.`);
  }

  /* -----------------------------
     Fallback (quiet scans)
  ----------------------------- */
  if (bullets.length === 0) {
    const okItems = Object.entries(rawChecks)
      .filter(([, v]) => v?.value === "ok")
      .slice(0, 3)
      .map(([id]) => labelForCheckId(id));

    if (okItems.length > 0) {
      bullets.push(`Checks marked normal: ${okItems.join(", ")}.`);
    }

    if (photos.length > 0) {
      bullets.push(`Photos captured: ${photos.length}.`);
    }
  }

  // Cap verbosity
  return bullets.slice(0, 14);
}

/* =========================================================
   Evidence summary sentence
========================================================= */

export function buildEvidenceSummaryText(args: {
  concernCount: number;
  unsureCount: number;
  imperfectionsCount: number;
  photosCount: number;
  followUpsCount: number;
}): string {
  const {
    concernCount,
    unsureCount,
    imperfectionsCount,
    photosCount,
    followUpsCount,
  } = args;

  const parts: string[] = [];

  if (concernCount > 0) {
    parts.push(
      concernCount === 1
        ? "You recorded 1 item that stood out."
        : `You recorded ${concernCount} items that stood out.`
    );
  } else {
    parts.push(
      "You didn’t mark any items as ‘stood out’ in the checks you completed."
    );
  }

  if (unsureCount > 0) {
    parts.push(
      unsureCount === 1
        ? "1 item couldn’t be confirmed."
        : `${unsureCount} items couldn’t be confirmed.`
    );
  }

  if (imperfectionsCount > 0) {
    parts.push(
      imperfectionsCount === 1
        ? "You recorded 1 imperfection."
        : `You recorded ${imperfectionsCount} imperfections.`
    );
  }

  if (photosCount > 0) {
    parts.push(
      `You captured ${photosCount} photo${photosCount === 1 ? "" : "s"}.`
    );
  }

  if (followUpsCount > 0) {
    parts.push(
      `You added ${followUpsCount} follow-up note${
        followUpsCount === 1 ? "" : "s"
      }.`
    );
  }

  return parts.join(" ");
}

/* =========================================================
   Evidence summary object (UI-ready)
========================================================= */

export function buildEvidenceSummary(args: {
  rawChecks: Record<string, CheckAnswer>;
  imperfections: NonNullable<ScanProgress["imperfections"]>;
  photos: NonNullable<ScanProgress["photos"]>;
  followUps: NonNullable<ScanProgress["followUpPhotos"]>;
  keyChecksExpected: number;
  photosExpected: number;
}): EvidenceSummary {
  const { rawChecks, imperfections, photos, followUps } = args;

  const rawValues = Object.values(rawChecks);

  const concernCount = rawValues.filter(
    (v) => v?.value === "concern"
  ).length;

  const unsureCount = rawValues.filter(
    (v) => v?.value === "unsure"
  ).length;

  const explicitlyUncertainItems = Object.entries(rawChecks)
    .filter(([, v]) => v?.value === "unsure")
    .map(([id, v]) => {
      const label = labelForCheckId(id);
      return v.note ? `${label} — ${v.note}` : label;
    });

  const bullets = buildEvidenceBullets({
    rawChecks,
    imperfections,
    photos,
    followUps,
  });

  const summary = buildEvidenceSummaryText({
    concernCount,
    unsureCount,
    imperfectionsCount: imperfections.length,
    photosCount: photos.length,
    followUpsCount: followUps.length,
  });

  return {
    summary,
    bullets,

    photosCaptured: photos.length,
    photosExpected: args.photosExpected,

    checksCompleted: rawValues.filter((v) => Boolean(v?.value)).length,
    keyChecksExpected: args.keyChecksExpected,

    imperfectionsNoted: imperfections.length,
    followUpPhotosCaptured: followUps.length,

    explicitlyUncertainItems,
  };
}
