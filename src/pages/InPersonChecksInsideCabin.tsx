// src/pages/InPersonChecksInsideCabin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sofa, MessageSquarePlus, X } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

type CheckItem = {
  id: string;
  title: string;
  guidance: string;
  chips: {
    concern: string[];
    unsure: string[];
  };
};

function asOneLine(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function appendChip(existing: string | undefined, chip: string) {
  const clean = asOneLine(chip);
  if (!clean) return existing ?? "";

  const current = (existing ?? "").trim();
  if (!current) return clean;

  const lower = current.toLowerCase();
  if (lower.includes(clean.toLowerCase())) return current;

  return `${current}${current.endsWith(".") ? " " : ". "}${clean}`;
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
  checkConfigs: CheckItem[],
  locationLabel: string
) {
  const byId = new Map<string, CheckItem>();
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
        location: locationLabel,
        note: (a?.note ?? "").trim() || undefined,
      };
    });

  return imperfections;
}

export default function InPersonChecksInsideCabin() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  // UI-only: whether custom note box is open per check
  const [noteOpen, setNoteOpen] = useState<Record<string, boolean>>({});

  /* -------------------------------------------------------
     Progress indicator (checks corridor only)
  ------------------------------------------------------- */
  const steps = useMemo(
    () => [
      { key: "around", label: "Around" },
      { key: "inside", label: "Inside" },
      { key: "drive", label: "Drive" },
    ],
    []
  );

  const currentIndex = 1; // inside
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  const checks: CheckItem[] = useMemo(
    () => [
      {
        id: "interior-smell",
        title: "Smell or moisture",
        guidance: "Note any damp or musty smells.",
        chips: {
          concern: [
            "Musty smell",
            "Damp carpet",
            "Mould spots",
            "Strong smoke smell",
            "Aircon smell",
          ],
          unsure: ["Couldn’t check boot area", "Raining / wet day", "Short inspection"],
        },
      },
      {
        id: "interior-condition",
        title: "General interior condition",
        guidance: "Normal wear is expected — note anything unusually rough.",
        chips: {
          concern: [
            "Torn seat",
            "Sagging headliner",
            "Sticky buttons",
            "Worn steering wheel",
            "Cracked dash",
          ],
          unsure: ["Didn’t check rear seats", "Low light", "Seat covers fitted"],
        },
      },
      {
        id: "aircon",
        title: "Air-conditioning",
        guidance: "Weak airflow or warm air can be worth noting.",
        chips: {
          concern: [
            "Not cold",
            "Weak airflow",
            "Noisy fan",
            "Bad smell on AC",
            "Takes too long to cool",
          ],
          unsure: ["Didn’t run long enough", "Couldn’t test (seller rushed)"],
        },
      },
    ],
    []
  );

  /* -------------------------------------------------------
     Persist progress + auto-build imperfections
  ------------------------------------------------------- */
  useEffect(() => {
    const existingImperfections = Array.isArray(progress?.imperfections)
      ? progress.imperfections
      : [];

    const aroundSet = new Set<string>();
    for (const imp of existingImperfections) {
      const loc = String((imp as any)?.location ?? "").toLowerCase();
      if (loc.includes("around")) aroundSet.add(String((imp as any)?.id ?? ""));
    }

    const insideImperfections = buildImperfectionsFromChecks(
      answers,
      checks,
      "Inside the cabin"
    );

    // Keep around-car imperfections if they already exist,
    // then add/replace inside-cabin derived imperfections.
    const kept = existingImperfections.filter((imp: any) =>
      aroundSet.has(String(imp?.id ?? ""))
    );

    const merged = [...kept, ...insideImperfections];

    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/inside",
      checks: answers,
      imperfections: merged,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, checks]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], value } }));

    // If OK, collapse note UI to reduce clutter
    if (value === "ok") {
      setNoteOpen((p) => ({ ...p, [id]: false }));
    }
  }

  function setNote(id: string, note: string) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], note } }));
  }

  function addChip(id: string, chip: string) {
    setAnswers((p) => {
      const existing = p[id]?.note ?? "";
      const next = appendChip(existing, chip);
      return { ...p, [id]: { ...p[id], note: next } };
    });
    setNoteOpen((p) => ({ ...p, [id]: true }));
  }

  function clearNote(id: string) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], note: "" } }));
    setNoteOpen((p) => ({ ...p, [id]: false }));
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      {/* Mini progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>Checks</span>
          <span>{percent}%</span>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          {steps.map((s, i) => {
            const active = i === currentIndex;
            const done = i < currentIndex;
            return (
              <div
                key={s.key}
                className={[
                  "flex-1 text-center",
                  active ? "text-slate-200 font-medium" : "",
                  done ? "text-slate-300" : "",
                ].join(" ")}
              >
                {s.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Sofa className="h-5 w-5 text-slate-400" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Inside the cabin</h1>
          <p className="text-sm text-slate-400">
            Quick-tap answers first. Add a note only if it matters.
          </p>
        </div>
      </div>

      {checks.map((c) => {
        const current = answers[c.id];
        const value = current?.value;
        const note = current?.note ?? "";
        const showChips = value === "concern" || value === "unsure";
        const isOpen = Boolean(noteOpen[c.id] || note.trim().length > 0);

        const chipSet =
          value === "concern"
            ? c.chips.concern
            : value === "unsure"
            ? c.chips.unsure
            : [];

        return (
          <section
            key={c.id}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 space-y-3"
          >
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-100">{c.title}</div>
              <p className="text-xs text-slate-400">{c.guidance}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(c.id, "ok")}
                className={[
                  "flex-1 rounded-xl px-3 py-2 text-xs border transition",
                  value === "ok"
                    ? "bg-emerald-500 text-black border-emerald-500"
                    : "border-white/20 text-slate-200 hover:bg-white/5",
                ].join(" ")}
              >
                Seemed normal
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnswer(c.id, "concern");
                  setNoteOpen((p) => ({ ...p, [c.id]: true }));
                }}
                className={[
                  "flex-1 rounded-xl px-3 py-2 text-xs border transition",
                  value === "concern"
                    ? "bg-amber-400 text-black border-amber-400"
                    : "border-white/20 text-slate-200 hover:bg-white/5",
                ].join(" ")}
              >
                Something stood out
              </button>

              <button
                type="button"
                onClick={() => {
                  setAnswer(c.id, "unsure");
                  setNoteOpen((p) => ({ ...p, [c.id]: true }));
                }}
                className={[
                  "flex-1 rounded-xl px-3 py-2 text-xs border transition",
                  value === "unsure"
                    ? "bg-slate-700 text-white border-slate-600"
                    : "border-white/20 text-slate-200 hover:bg-white/5",
                ].join(" ")}
              >
                Couldn’t check
              </button>
            </div>

            {/* Quick chips */}
            {showChips && chipSet.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Quick notes (tap to add)
                </p>

                <div className="flex flex-wrap gap-2">
                  {chipSet.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addChip(c.id, chip)}
                      className="rounded-full border border-white/15 bg-slate-950/40 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setNoteOpen((p) => ({ ...p, [c.id]: !isOpen }))
                    }
                    className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white"
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    {isOpen ? "Hide note" : "Add custom note"}
                  </button>

                  {note.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearNote(c.id)}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Note box */}
            {isOpen && (
              <textarea
                value={note}
                onChange={(e) => setNote(c.id, e.target.value)}
                placeholder="Optional detail…"
                className="w-full rounded-xl bg-slate-950 border border-white/15 px-3 py-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            )}
          </section>
        );
      })}

      {/* NAVIGATION */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/around")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
