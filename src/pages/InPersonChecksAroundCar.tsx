// src/pages/InPersonChecksAroundCar.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

type CheckConfig = {
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

export default function InPersonChecksAroundCar() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckConfig[] = useMemo(
    () => [
      {
        id: "body-panels-paint",
        title: "Body panels & paint",
        guidance:
          "Walk around the car and look for mismatched paint, uneven gaps, or signs of repair.",
        quickConcerns: [
          "Panel gaps look uneven",
          "Paint mismatch between panels",
          "Overspray / rough paint edge",
          "Dents or noticeable ripples",
          "Scratches through the paint",
        ],
        quickUnsure: [
          "Car was dirty / hard to tell",
          "Lighting made it difficult",
          "Couldn’t see one side properly",
        ],
      },
      {
        id: "headlights-condition",
        title: "Headlights condition",
        guidance:
          "Look for cloudy/yellow lenses, cracks, or moisture inside. Poor headlights reduce night visibility and can be costly to fix.",
        quickConcerns: [
          "Slightly cloudy / hazy",
          "Very cloudy / yellow",
          "Cracked lens",
          "Moisture / fogging inside",
          "One headlight looks different",
        ],
        quickUnsure: [
          "Hard to tell in this lighting",
          "Headlights were dirty",
          "Couldn’t get close enough",
        ],
      },
      {
        id: "windscreen-damage",
        title: "Windscreen damage",
        guidance:
          "Check for chips or cracks. Even small chips can spread, and cracks can be a safety issue (and expensive to replace).",
        quickConcerns: [
          "Small chip",
          "Multiple chips",
          "Crack (any size)",
          "Chip/crack in driver’s view",
          "Windscreen looks heavily pitted",
        ],
        quickUnsure: [
          "Glare made it hard to see",
          "Windscreen was dirty",
          "Couldn’t inspect closely",
        ],
      },
      {
        id: "tyre-wear",
        title: "Tyre wear & tread",
        guidance: "Look for even wear across each tyre and reasonable tread.",
        quickConcerns: [
          "Tread looks low",
          "Uneven wear pattern",
          "Cracks / dry rot",
          "One tyre mismatched",
          "Tyre looks very old",
        ],
        quickUnsure: [
          "Couldn’t see inner edge",
          "Car parked too close",
          "Not sure what’s normal",
        ],
      },
      {
        id: "brakes-visible",
        title: "Brake discs (if visible)",
        guidance:
          "Light surface rust is normal. You’re looking for heavy wear or rough surfaces.",
        quickConcerns: [
          "Deep lip / ridge on disc",
          "Scoring / grooves",
          "Heavy rust / pitting",
          "Looks overdue for replacement",
        ],
        quickUnsure: [
          "Wheels cover the disc",
          "Couldn’t see through spokes",
          "Not confident what’s normal",
        ],
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
     Persist progress (CHECKS ONLY)
     IMPORTANT:
     - We do NOT auto-generate imperfections from checks anymore.
     - Otherwise the Results page shows duplicates:
         - Once in "Checks"
         - Again in "Imperfections"
  ------------------------------------------------------- */
  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/around",
      checks: answers,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

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
          <Car className="h-5 w-5 text-slate-400" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white">Around the car</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Do a quick walk-around. If anything looks off, mark it and add a
            note. This keeps your report grounded in what you actually saw.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selectedLines = splitLines(current?.note);

          const selectedValue: AnswerValue = current?.value ?? "ok";

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

              {selectedValue === "concern" && c.quickConcerns.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Quick notes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.quickConcerns.map((chip) => {
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
                              ? "bg-amber-400/20 border-amber-300/40 text-amber-100"
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

              {selectedValue === "unsure" && c.quickUnsure.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Why couldn’t you check?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.quickUnsure.map((chip) => {
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
                              ? "bg-slate-500/40 border-slate-300/30 text-white"
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

      <button
        type="button"
        onClick={() => navigate("/scan/in-person/checks/inside")}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 transition"
      >
        Continue
      </button>
    </div>
  );
}
