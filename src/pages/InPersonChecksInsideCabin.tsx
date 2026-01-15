// src/pages/InPersonChecksInsideCabin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sofa } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

export default function InPersonChecksInsideCabin() {
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

  const currentIndex = 1; // inside
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  /* -------------------------------------------------------
     Persist progress
  ------------------------------------------------------- */
  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/inside",
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

  const checks = [
    {
      id: "interior-smell",
      title: "Smell or moisture",
      guidance: "Note any damp or musty smells.",
    },
    {
      id: "interior-condition",
      title: "General interior condition",
      guidance: "Normal wear is expected.",
    },
    {
      id: "aircon",
      title: "Air-conditioning",
      guidance: "Weak airflow may be worth noting.",
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
        <Sofa className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-white">Inside the cabin</h1>
      </div>

      {checks.map((c) => {
        const current = answers[c.id];

        return (
          <section
            key={c.id}
            className="rounded-xl bg-slate-900/60 px-4 py-4 space-y-2"
          >
            <div className="text-sm font-medium text-slate-200">{c.title}</div>
            <p className="text-xs text-slate-400">{c.guidance}</p>

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

            {(current?.value === "concern" || current?.note) && (
              <textarea
                value={current?.note ?? ""}
                onChange={(e) => setNote(c.id, e.target.value)}
                placeholder="Add a note (optional)…"
                className="w-full mt-2 rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-xs text-slate-200"
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
          onClick={() => navigate("/scan/in-person/checks/drive")}
          className="flex-1 rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
