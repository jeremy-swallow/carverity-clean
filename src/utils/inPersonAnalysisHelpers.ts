// src/utils/inPersonAnalysisHelpers.ts

import type { ScanProgress } from "./inPersonAnalysisTypes";

/* =========================================================
   Generic helpers
========================================================= */

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function hasNote(note?: string) {
  return (note ?? "").trim().length >= 5;
}

export function severityWeight(sev?: string) {
  if (sev === "major") return 3;
  if (sev === "moderate") return 2;
  return 1;
}

export function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function asOneLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function normKey(s: string) {
  return asOneLine(String(s ?? ""))
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* =========================================================
   Check label helpers
========================================================= */

const CHECK_LABELS: Record<string, string> = {
  /* Cabin */
  "interior-smell": "Smell or moisture",
  "interior-condition": "General interior condition",
  "seat-adjustment": "Seat adjustment & stability",
  "windows-mirrors": "Windows & mirrors",
  "seatbelts-trim": "Seatbelts & airbag trim",
  aircon: "Air-conditioning",

  /* Drive */
  steering: "Steering & handling feel",
  "noise-hesitation": "Noise / hesitation under power",
  "adas-systems": "Driver-assist systems (if fitted)",

  /* Exterior / legacy */
  "body-panels-paint": "Body panels & paint",
  "headlights-condition": "Headlights condition",
  "windscreen-damage": "Windscreen damage",
  "tyre-wear": "Tyre wear & tread",
  "brakes-visible": "Brake discs (if visible)",
  "body-panels": "Body panels & alignment",
  paint: "Paint condition",
  "glass-lights": "Glass & lights",
  tyres: "Tyres condition",
  "underbody-leaks": "Visible fluid leaks (if noticed)",
};

export function labelForCheckId(id: string) {
  return CHECK_LABELS[id] || titleFromId(id);
}

/* =========================================================
   Imperfection deduplication
========================================================= */

/**
 * Deduplicate imperfections so the report doesn't repeat itself.
 * We combine locations into a single location string.
 */
export function dedupeImperfections(
  imperfections: NonNullable<ScanProgress["imperfections"]>
): NonNullable<ScanProgress["imperfections"]> {
  const list = Array.isArray(imperfections) ? imperfections : [];
  if (list.length <= 1) return list;

  type Agg = {
    id: string;
    label?: string;
    severity?: "minor" | "moderate" | "major";
    note?: string;
    locations: string[];
  };

  const map = new Map<string, Agg>();

  for (const imp of list) {
    const label = (imp.label ?? "").trim();
    const note = (imp.note ?? "").trim();
    const sev = imp.severity ?? "minor";

    const baseId = (imp.id ?? "").trim();
    const identity = normKey(label || baseId || "imperfection");
    const noteKey = normKey(note);

    // Include severity to avoid merging minor + major incorrectly
    const key = `${identity}__${sev}__${noteKey}`;

    const loc = (imp.location ?? "").trim();
    const locClean = loc ? asOneLine(loc) : "";

    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        id: baseId || identity || `imp-${Math.random().toString(16).slice(2)}`,
        label: label || undefined,
        severity: sev,
        note: note || undefined,
        locations: locClean ? [locClean] : [],
      });
    } else {
      if (locClean && !existing.locations.includes(locClean)) {
        existing.locations.push(locClean);
      }
    }
  }

  const merged = Array.from(map.values()).map((a) => {
    const location =
      a.locations.length > 1
        ? a.locations.join(" • ")
        : a.locations.length === 1
        ? a.locations[0]
        : undefined;

    return {
      id: a.id,
      label: a.label,
      severity: a.severity,
      note: a.note,
      location,
    };
  });

  // Sort: major → moderate → minor, then label
  merged.sort((a, b) => {
    const wA = severityWeight(a.severity);
    const wB = severityWeight(b.severity);
    if (wB !== wA) return wB - wA;
    return normKey(a.label ?? a.id).localeCompare(normKey(b.label ?? b.id));
  });

  return merged;
}
