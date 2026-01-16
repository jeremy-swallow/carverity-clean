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

  // Avoid duplicates (case-insensitive)
  const parts = base
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.some((p) => p.toLowerCase() === add.toLowerCase())) return base;

  return `${base}\n${add}`;
}

export default function InPersonChecksAroundCar() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

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

  const currentIndex = 0; // around
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  /* -------------------------------------------------------
     Persist progress
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
    setAnswers((p) => ({ ...p, [id]: { ...p[id], value } }));
  }

  function setNote(id: string, note: string) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], note } }));
  }

  function applyChip(id: string, chip: string) {
    setAnswers((p) => {
      const existing = p[id]?.note ?? "";
      const next = mergeNote(existing, chip);
      return { ...p, [id]: { ...p[id], note: next } };
    });
  }

  const checks: CheckConfig[] = [
    {
      id: "tyre-wear",
      title: "Tyre wear & tread",
      guidance:
        "Look for even wear across each tyre. Uneven wear can hint at alignment or suspension issues.",
      quickConcerns: [
        "Uneven wear",
        "Very low tread",
        "Cracks / dry rot",
        "Different tyres mixed",
      ],
      quickUnsure: ["Couldn’t see inner tread", "Not safe to check"],
    },
    {
      id: "brakes-visible",
      title: "Brake discs (if visible)",
      guidance:
        "Light surface rust can be normal. Deep grooves or heavy scoring can be worth noting.",
      quickConcerns: ["Heavy scoring", "Deep grooves", "Looks worn thin"],
      quickUnsure: ["Not visible", "Wheel design blocks view"],
    },
    {
      id: "seatbelts-trim",
      title: "Seatbelts and airbag trim",
      guidance:
        "Check for fraying, damage, or loose trim. If something looks tampered with, treat it as important.",
      quickConcerns: ["Frayed belt", "Loose trim", "Looks repaired / tampered"],
      quickUnsure: ["Didn’t check all seats", "Couldn’t access rear seats"],
    },
  ];

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
        <Car className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-white">Around the car</h1>
      </div>

      <p className="text-sm text-slate-400">
        Tap an answer. Only add a note if something stood out — you can use the
        quick chips to avoid typing.
      </p>

      {checks.map((c) => {
        const current = answers[c.id];

        return (
          <section
            key={c.id}
