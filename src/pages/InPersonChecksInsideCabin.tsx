// src/pages/InPersonChecksInsideCabin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sofa } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

type CheckItem = {
  id: string;
  title: string;
  guidance: string;
  quickConcerns: string[];
  quickUnsure: string[];
};

function mergeNote(existing: string | undefined, addition: string) {
  const base = (existing ?? "").trim();
  const add = addition.trim();
  if (!add) return base;
  if (!base) return add;

  const parts = base
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // Prevent duplicates
  if (parts.some((p) => p.toLowerCase() === add.toLowerCase())) return base;

  return [...parts, add].join("\n");
}

function removeLine(existing: string | undefined, lineToRemove: string) {
  const base = (existing ?? "").trim();
  if (!base) return "";

  const parts = base
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  const next = parts.filter(
    (p) => p.toLowerCase() !== lineToRemove.trim().toLowerCase()
  );

  return next.join("\n");
}

function splitLines(note?: string) {
  return (note ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

function slugifyLocation(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Build progress.imperfections[] from THIS STEP'S checks only.
 *
 * Rule:
 * - Only "concern" answers become imperfections
 * - label = check title
 * - note = check note (if any)
 * - severity = minor (default)
 *
 * CRITICAL FIX:
 * - Only consider check IDs that exist in checkConfigs for this step.
 */
function buildImperfectionsFromChecks(
  checks: Record<string, CheckAnswer>,
  checkConfigs: CheckItem[],
  locationLabel: string
) {
  const byId = new Map<string, CheckItem>();
  for (const c of checkConfigs) byId.set(c.id, c);

  const locationSlug = slugifyLocation(locationLabel);

  const imperfections = Object.entries(checks || {})
    .filter(([id, a]) => byId.has(id) && a?.value === "concern")
    .map(([id, a]) => {
      const cfg = byId.get(id)!;

      return {
        id: `imp:${locationSlug}:${id}`,
        label: cfg.title,
        severity: "minor" as const,
        location: locationLabel,
        note: (a?.note ?? "").trim() || undefined,
      };
    });

  return imperfections;
}

export default function InPersonChecksInsideCabin() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckItem[] = useMemo(
    () => [
      {
        id: "interior-smell",
        title: "Smell or moisture",
        guidance:
          "A damp or musty smell can hint at leaks, water entry, or poor storage.",
        quickConcerns: [
          "Musty smell",
          "Damp carpet",
          "Mould spots",
          "Strong smoke smell",
          "Aircon smell",
        ],
        quickUnsure: [
          "Raining / wet day",
          "Short inspection",
          "Couldn’t check boot area",
        ],
      },
      {
        id: "interior-condition",
        title: "General interior condition",
        guidance:
          "Normal wear is expected — you’re looking for unusually rough condition.",
        quickConcerns: [
          "Torn seat",
          "Sagging headliner",
          "Sticky buttons",
          "Worn steering wheel",
          "Cracked dash",
        ],
        quickUnsure: [
          "Didn’t check rear seats",
          "Low light",
          "Seat covers fitted",
        ],
      },
      {
        id: "seatbelts-trim",
        title: "Seatbelts & airbag trim",
        guidance:
          "Check belts retract smoothly and airbag trim looks intact and undisturbed.",
        quickConcerns: [
          "Belt frayed / damaged",
          "Belt doesn’t retract smoothly",
          "Airbag trim looks disturbed",
          "Warning label / trim missing",
        ],
        quickUnsure: [
          "Couldn’t fully test retraction",
          "Trim hard to inspect quickly",
        ],
      },
      {
        id: "aircon",
        title: "Air-conditioning",
        guidance:
          "Weak airflow, warm air, or strange smells are worth noting before purchase.",
        quickConcerns: [
          "Not cold",
          "Weak airflow",
          "Noisy fan",
          "Bad smell on AC",
          "Takes too long to cool",
        ],
        quickUnsure: ["Didn’t run long enough", "Couldn’t test (seller rushed)"],
      },
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  /* -------------------------------------------------------
     Auto-save defaults so "Looks fine" isn't just visual
     - Only fills missing answers (never overwrites user choices)
  ------------------------------------------------------- */
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next: Record<string, CheckAnswer> = { ...(prev ?? {}) };

      for (const c of checks) {
        const existing = next[c.id];

        if (!existing || !existing.value) {
          next[c.id] = { ...(existing ?? {}), value: "ok" };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [checks]);

  /* -------------------------------------------------------
     Persist progress + auto-build imperfections
     - Replace only "Inside the cabin" derived imperfections
     - Keep everything else untouched (around car, drive, photos, etc)
  ------------------------------------------------------- */
  useEffect(() => {
    const existingImperfections = Array.isArray(progress?.imperfections)
      ? progress.imperfections
      : [];

    const kept = existingImperfections.filter((imp: any) => {
      const loc = String(imp?.location ?? "").toLowerCase();
      return !loc.includes("inside the cabin");
    });

    const insideImperfections = buildImperfectionsFromChecks(
      answers,
      checks,
      "Inside the cabin"
    );

    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/inside",
      checks: answers,
      imperfections: [...kept, ...insideImperfections],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, checks]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((p) => {
      const prev = p[id];
      return { ...p, [id]: { ...prev, value } };
    });
  }

  function setNote(id: string, note: string) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], note } }));
  }

  function toggleChip(id: string, chipText: string) {
    setAnswers((p) => {
      const prev = p[id] ?? { value: "ok" as AnswerValue, note: "" };
      const lines = splitLines(prev.note);

      const already = lines.some(
        (l) => l.toLowerCase() === chipText.toLowerCase()
      );

      const nextNote = already
        ? removeLine(prev.note, chipText)
        : mergeNote(prev.note, chipText);

      return { ...p, [id]: { ...prev, note: nextNote } };
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <Sofa className="h-5 w-5 text-slate-400" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white">Inside the cabin</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Quick checks that help you spot wear, odd smells, and anything that
            feels inconsistent with the asking price.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selectedLines = splitLines(current?.note);

          const selectedValue: AnswerValue = current?.value ?? "ok";

          const chips =
            selectedValue === "concern"
              ? c.quickConcerns
              : selectedValue === "unsure"
              ? c.quickUnsure
              : [];

          return (
            <section
              key={c.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-5 space-y-4"
            >
              <div className="space-y-1">
                <div className="text-sm text-white font-semibold">{c.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {c.guidance}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAnswer(c.id, "ok")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold transition border",
                    selectedValue === "ok"
                      ? "bg-emerald-500 text-black border-emerald-400/30"
                      : "bg-slate-950/30 text-slate-200 border-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  Looks fine
                </button>

                <button
                  type="button"
                  onClick={() => setAnswer(c.id, "concern")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold transition border",
                    selectedValue === "concern"
                      ? "bg-amber-400 text-black border-amber-300/40"
                      : "bg-slate-950/30 text-slate-200 border-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  Something off
                </button>

                <button
                  type="button"
                  onClick={() => setAnswer(c.id, "unsure")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold transition border",
                    selectedValue === "unsure"
                      ? "bg-slate-600 text-white border-slate-400/30"
                      : "bg-slate-950/30 text-slate-200 border-white/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  Couldn’t check
                </button>
              </div>

              {chips.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Quick notes
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => {
                      const active = selectedLines.some(
                        (l) => l.toLowerCase() === chip.toLowerCase()
                      );

                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleChip(c.id, chip)}
                          className={[
                            "rounded-full border px-3 py-1 text-xs transition",
                            active
                              ? selectedValue === "concern"
                                ? "bg-amber-400/20 border-amber-300/40 text-amber-100"
                                : "bg-slate-500/40 border-slate-300/30 text-white"
                              : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10",
                          ].join(" ")}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(selectedValue === "concern" ||
                selectedValue === "unsure" ||
                Boolean(current?.note)) && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Optional detail
                  </p>

                  <textarea
                    value={current?.note ?? ""}
                    onChange={(e) => setNote(c.id, e.target.value)}
                    placeholder="Add a short note (optional)…"
                    className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/30"
                    rows={3}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/around")}
          className="flex-1 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200 font-semibold transition"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
