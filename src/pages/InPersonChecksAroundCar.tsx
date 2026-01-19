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

/**
 * Build progress.imperfections[] from existing progress.checks
 * WITHOUT asking the user to enter anything twice.
 *
 * Rule:
 * - Only "concern" answers become imperfections
 * - label = check title
 * - note = check note (if any)
 * - severity = minor (default)
 */
function buildImperfectionsFromChecks(
  checks: Record<string, CheckAnswer>,
  checkConfigs: CheckConfig[]
) {
  const byId = new Map<string, CheckConfig>();
  for (const c of checkConfigs) byId.set(c.id, c);

  const imperfections = Object.entries(checks || [])
    .filter(([_, a]) => a?.value === "concern")
    .map(([id, a]) => {
      const cfg = byId.get(id);
      const label = cfg?.title || id;

      return {
        id: `imp:${id}`,
        label,
        severity: "minor" as const,
        location: "Around the car",
        note: (a?.note ?? "").trim() || undefined,
      };
    });

  return imperfections;
}

export default function InPersonChecksAroundCar() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckConfig[] = useMemo(
    () => [
      {
        id: "tyre-wear",
        title: "Tyre wear & tread",
        guidance: "Look for even wear across each tyre.",
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
          "Too dark to check properly",
        ],
      },
      {
        id: "brakes-visible",
        title: "Brake discs (if visible)",
        guidance: "Light surface rust is normal.",
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
      {
        id: "seatbelts-trim",
        title: "Seatbelts and airbag trim",
        guidance: "Check for fraying or damage.",
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
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  useEffect(() => {
    const imperfections = buildImperfectionsFromChecks(answers, checks);

    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/around",
      checks: answers,
      imperfections,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, checks]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((p) => {
      const prev = p[id];

      // Keep note even if switching to OK (fine)
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
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Car className="h-5 w-5 text-slate-400" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Around the car</h1>
          <p className="text-sm text-slate-400 mt-1">
            Tap the best match. If something stood out, pick a quick note (or
            add your own).
          </p>
        </div>
      </div>

      {checks.map((c) => {
        const current = answers[c.id];
        const selectedLines = splitLines(current?.note);

        return (
          <section
            key={c.id}
            className="rounded-xl bg-slate-900/60 px-4 py-4 space-y-3 border border-white/5"
          >
            <div>
              <div className="text-sm text-slate-200 font-medium">{c.title}</div>
              <p className="text-xs text-slate-400 mt-1">{c.guidance}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(c.id, "ok")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition ${
                  current?.value === "ok"
                    ? "bg-emerald-500 text-black"
                    : "border border-white/20 text-slate-200 hover:bg-white/5"
                }`}
              >
                Seemed normal
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "concern")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition ${
                  current?.value === "concern"
                    ? "bg-amber-400 text-black"
                    : "border border-white/20 text-slate-200 hover:bg-white/5"
                }`}
              >
                Something stood out
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "unsure")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs transition ${
                  current?.value === "unsure"
                    ? "bg-slate-600 text-white"
                    : "border border-white/20 text-slate-200 hover:bg-white/5"
                }`}
              >
                Couldn’t check
              </button>
            </div>

            {current?.value === "concern" && c.quickConcerns.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Quick notes (tap to add)
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

            {current?.value === "unsure" && c.quickUnsure.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Why couldn’t you check? (tap to add)
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

            {(current?.value === "concern" ||
              current?.value === "unsure" ||
              current?.note) && (
              <textarea
                value={current?.note ?? ""}
                onChange={(e) => setNote(c.id, e.target.value)}
                placeholder="Optional: add extra detail…"
                className="w-full rounded-lg bg-slate-950/40 border border-white/15 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/30"
                rows={3}
              />
            )}
          </section>
        );
      })}

      <button
        type="button"
        onClick={() => navigate("/scan/in-person/checks/inside")}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 transition"
      >
        Continue
      </button>
    </div>
  );
}
