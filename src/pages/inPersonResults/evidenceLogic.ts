// src/pages/inPersonResults/evidenceLogic.ts

/* =======================================================
   Types
======================================================= */

export type FlaggedCheck = {
  id: string;
  label: string;
  value: "concern" | "unsure";
  note: string;
};

export type CleanImperfection = {
  id: string;
  label: string;
  location: string;
  note: string;
  severity: "minor" | "moderate" | "major";
};

export type EvidenceSummary = {
  text: string;
  bullets: string[];
};

export type EvidenceBundle = {
  flaggedChecks: FlaggedCheck[];
  imperfections: CleanImperfection[];
  uncertaintyFactors: string[];
  evidenceSummary: EvidenceSummary;
  nextSteps: string[];
  clarifyQuestions: string[];
};

/* =======================================================
   Helpers
======================================================= */

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asCleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* =======================================================
   Check labels (canonical)
======================================================= */

const CHECK_LABELS: Record<string, string> = {
  "body-panels-paint": "Body panels & paint",
  "headlights-condition": "Headlights condition",
  "windscreen-damage": "Windscreen damage",
  "tyre-wear": "Tyre wear & tread",
  "brakes-visible": "Brake discs (if visible)",
  "seatbelts-trim": "Seatbelts & airbag trim",
  "interior-smell": "Smell or moisture",
  "interior-condition": "General interior condition",
  aircon: "Air-conditioning",
  steering: "Steering & handling feel",
  "noise-hesitation": "Noise / hesitation under power",
  "adas-systems": "Driver-assist systems (if fitted)",
  // legacy ids
  "body-panels": "Body panels & alignment",
  paint: "Paint condition",
  "glass-lights": "Glass & lights",
  tyres: "Tyres condition",
  "underbody-leaks": "Visible fluid leaks (if noticed)",
};

function labelForCheckId(id: string) {
  return CHECK_LABELS[id] || titleFromId(id);
}

/* =======================================================
   Flagged checks
======================================================= */

export function extractFlaggedChecks(progress: any): FlaggedCheck[] {
  const checks = progress?.checks ?? {};
  if (!checks || typeof checks !== "object") return [];

  const items = Object.entries(checks)
    .map(([id, v]: [string, any]) => {
      const value = v?.value as "concern" | "unsure" | undefined;
      const note = (v?.note ?? "").trim();

      if (value !== "concern" && value !== "unsure") return null;

      return {
        id,
        label: labelForCheckId(id),
        value,
        note,
      } satisfies FlaggedCheck;
    })
    .filter(Boolean) as FlaggedCheck[];

  items.sort((a, b) =>
    a.value === b.value ? 0 : a.value === "concern" ? -1 : 1
  );

  return items;
}

/* =======================================================
   Imperfections (sanitised)
======================================================= */

function normaliseImperfectionLabel(label: string): string {
  const t = String(label ?? "").trim();
  if (!t) return "";
  if (/^[a-z0-9]+(?:[-_][a-z0-9]+)+$/i.test(t)) {
    return titleFromId(t);
  }
  return t;
}

function normaliseLocation(loc: string): string {
  const t = String(loc ?? "").trim();
  if (!t) return "";

  const lower = t.toLowerCase();
  if (lower.includes("around")) return "Around the car";
  if (lower.includes("inside")) return "Inside the cabin";
  if (lower.includes("drive")) return "During the drive";

  return t;
}

function severitySafe(sev: unknown): "minor" | "moderate" | "major" {
  if (sev === "major") return "major";
  if (sev === "moderate") return "moderate";
  return "minor";
}

export function sanitiseImperfections(raw: any[]): CleanImperfection[] {
  const list = Array.isArray(raw) ? raw : [];

  const cleaned = list
    .map((imp: any) => {
      const id = String(imp?.id ?? "").trim();
      const label = normaliseImperfectionLabel(imp?.label);
      const location = normaliseLocation(imp?.location);
      const note = String(imp?.note ?? "").trim();
      const severity = severitySafe(imp?.severity);

      if (!id && !label && !location && !note) return null;

      const stableId =
        id ||
        `imp:${severity}:${label}:${location}:${note}`.slice(0, 80) ||
        `imp:${Date.now()}`;

      return {
        id: stableId,
        label: label || "Imperfection",
        location,
        note,
        severity,
      } satisfies CleanImperfection;
    })
    .filter(Boolean) as CleanImperfection[];

  const byKey = new Map<string, CleanImperfection>();

  for (const imp of cleaned) {
    const key = `${imp.label.toLowerCase()}||${imp.note.toLowerCase()}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, imp);
      continue;
    }

    if (!existing.location && imp.location) {
      byKey.set(key, imp);
      continue;
    }

    const weight = (s: string) =>
      s === "major" ? 0 : s === "moderate" ? 1 : 2;

    if (weight(imp.severity) < weight(existing.severity)) {
      byKey.set(key, imp);
    }
  }

  const result = Array.from(byKey.values());
  const weight = (s: string) =>
    s === "major" ? 0 : s === "moderate" ? 1 : 2;

  result.sort((a, b) => weight(a.severity) - weight(b.severity));
  return result;
}

/* =======================================================
   Uncertainty
======================================================= */

export function extractUncertaintyFactors(analysis: any): string[] {
  const raw: unknown[] = Array.isArray(analysis?.uncertaintyFactors)
    ? analysis.uncertaintyFactors
    : [];

  return raw.map((u: unknown) => {
    if (typeof u === "string") return u.trim();
    if (isRecord(u)) {
      return (
        asCleanText(u.label) ||
        asCleanText(u.title) ||
        asCleanText(u.reason) ||
        asCleanText(u.description) ||
        "You marked something as unsure."
      );
    }
    return "You marked something as unsure.";
  });
}

/* =======================================================
   Evidence summary
======================================================= */

export function extractEvidenceSummary(analysis: any): EvidenceSummary {
  const src = analysis?.evidenceSummary;

  let text = "";
  let bullets: string[] = [];

  if (typeof src === "string") {
    text = src.trim();
  } else if (Array.isArray(src)) {
    bullets = src.map(asCleanText).filter(Boolean);
  } else if (isRecord(src)) {
    text =
      asCleanText(src.summary) ||
      asCleanText(src.text) ||
      asCleanText(src.notes);

    const b =
      src.bullets ||
      src.bulletPoints ||
      src.points ||
      src.items;

    if (Array.isArray(b)) {
      bullets = b.map(asCleanText).filter(Boolean);
    }
  }

  return { text, bullets };
}

/* =======================================================
   Guidance (next steps + questions)
======================================================= */

export function buildNextSteps(params: {
  driveWasDone: boolean;
  criticalCount: number;
  moderateCount: number;
  unsureCount: number;
}): string[] {
  const steps: string[] = [];

  if (!params.driveWasDone) {
    steps.push(
      "If possible, do a short test drive. Even 5 minutes can reveal steering pull, vibration, or hesitation."
    );
  } else {
    steps.push(
      "You’ve already done a short drive — now focus on clarifying anything you marked as unsure or a concern."
    );
  }

  if (params.criticalCount > 0) {
    steps.push(
      "Start with the biggest concerns first. Ask for proof (invoice, photos, written confirmation)."
    );
  }

  if (params.moderateCount > 0) {
    steps.push(
      "Ask the seller to explain the items you recorded. Don’t guess — confirm."
    );
  }

  if (params.unsureCount > 0) {
    steps.push(
      "Anything marked “unsure” should be treated as unknown. Try to verify it before you buy."
    );
  }

  steps.push(
    "If you still like the car, open Price positioning & negotiation to see a realistic offer range and how to ask."
  );

  return steps.slice(0, 5);
}

export function buildClarifyQuestions(params: {
  criticalRisks: any[];
  moderateRisks: any[];
  unsureCount: number;
}): string[] {
  const qs: string[] = [];

  for (const r of [...params.criticalRisks, ...params.moderateRisks]) {
    const label = String(r?.label ?? "").trim();
    if (label) {
      qs.push(
        `Can you show proof for “${label}” (invoice, inspection note, photos, or written confirmation)?`
      );
    }
  }

  if (qs.length === 0 && params.unsureCount > 0) {
    qs.push(
      "Can you confirm the things I couldn’t check today (service history, repairs, warnings, faults) in writing?"
    );
  }

  if (qs.length === 0) {
    qs.push("Can you show the latest service invoice and any repair history?");
    qs.push("Are there any known faults or warning lights?");
  }

  return qs.slice(0, 4);
}
