// src/pages/InPersonChecksDrive.tsx

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

  if (parts.some((p) => p.toLowerCase() === add.toLowerCase())) return base;

  return `${base}\n${add}`;
}

export default function InPersonChecksDrive() {
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

  const currentIndex = 2; // drive
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  /* -------------------------------------------------------
     Persist progress
  ------------------------------------------------------- */
  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/drive",
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
      id: "steering",
      title: "Steering & handling feel",
      guidance:
        "On a safe, short drive: does it track straight? Any vibration, pulling, or knocking?",
      quickConcerns: [
        "Pulls to one side",
        "Steering wheel off-centre",
        "Vibration at speed",
        "Knock / clunk over bumps",
      ],
      quickUnsure: ["No test drive allowed", "Couldn’t drive far enough"],
    },
    {
      id: "noise-hesitation",
      title: "Noise / hesitation under power",
      guidance:
        "Any unusual noises, hesitation, harsh shifting, or warning lights during acceleration?",
      quickConcerns: [
        "Hesitation / lag",
        "Harsh gear changes",
        "Unusual engine noise",
        "Warning light appeared",
      ],
      quickUnsure: ["Couldn’t test acceleration", "Short / low-speed drive only"],
    },
    {
      id: "adas-systems",
      title: "Driver-assist systems (if fitted)",
      guidance:
        "If fitted: do sensors behave normally? Any unexpected alerts or warnings?",
      quickConcerns: [
        "Warning message",
        "Parking sensors inconsistent",
        "Adaptive cruise issue",
        "Lane assist alert",
      ],
      quickUnsure: ["Not fitted / unsure", "Didn’t test"],
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
        <h1 className="text-2xl font-semibold text-white">During the drive</h1>
      </div>

      <p className="text-sm text-slate-400">
        Tap an answer. If something stood out, use the quick chips to capture it
        fast (no typing needed).
      </p>

      {checks.map((c) => {
        const current = answers[c.id];

        return (
          <section
            key={c.id}
            className="rounded-2xl border border-white/12 bg-slate-900/60 px-4 py-4 space-y-3"
          >
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-200">{c.title}</div>
              <p className="text-xs text-slate-400">{c.guidance}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(c.id, "ok")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                  current?.value === "ok"
                    ? "bg-emerald-500 text-black border-emerald-500"
                    : "border-white/20 text-slate-200"
                }`}
              >
                Seemed normal
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "concern")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                  current?.value === "concern"
                    ? "bg-amber-400 text-black border-amber-400"
                    : "border-white/20 text-slate-200"
                }`}
              >
                Something stood out
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "unsure")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                  current?.value === "unsure"
                    ? "bg-slate-600 text-white border-slate-600"
                    : "border-white/20 text-slate-200"
                }`}
              >
                Couldn’t check
              </button>
            </div>

            {(current?.value === "concern" || current?.value === "unsure") && (
              <div className="space-y-2 pt-1">
                {current?.value === "concern" && (
                  <div className="flex flex-wrap gap-2">
                    {c.quickConcerns.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => applyChip(c.id, chip)}
                        className="rounded-full border border-white/15 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                {current?.value === "unsure" && (
                  <div className="flex flex-wrap gap-2">
                    {c.quickUnsure.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => applyChip(c.id, chip)}
                        className="rounded-full border border-white/15 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(current?.value === "concern" ||
              current?.value === "unsure" ||
              current?.note) && (
              <textarea
                value={current?.note ?? ""}
                onChange={(e) => setNote(c.id, e.target.value)}
                placeholder="Optional note…"
                className="w-full rounded-lg bg-slate-950 border border-white/15 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 whitespace-pre-line"
              />
            )}
          </section>
        );
      })}

      {/* NAVIGATION */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/inside")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/summary")}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
