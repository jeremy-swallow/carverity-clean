// src/pages/InPersonChecksDrive.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge, Radar } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

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
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], value },
    }));
  }

  function setNote(id: string, note: string) {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], note },
    }));
  }

  const checks = [
    {
      id: "steering",
      title: "Steering & handling",
      guidance: "Notice pulling, vibration, or looseness.",
    },
    {
      id: "noise-hesitation",
      title: "Noise or hesitation",
      guidance: "Listen for unusual sounds or delays.",
    },
    {
      id: "adas-systems",
      title: "Driver-assist safety systems (if fitted)",
      guidance:
        "Blind-spot monitoring, lane assist, adaptive cruise, collision warnings — note if anything didn’t behave as expected.",
      icon: Radar,
    },
  ];

  function finishChecks() {
    navigate("/scan/in-person/summary");
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
        <Gauge className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-white">
          Short drive (if allowed)
        </h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-4">
        <p className="text-sm text-slate-200 font-medium">Before you drive</p>
        <p className="text-xs text-slate-400 mt-1">
          Keep it short and safe. You’re only looking for obvious behaviours —
          not trying to diagnose faults.
        </p>
        <ul className="mt-3 text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li>Steer gently both directions (feel for pulling or vibration)</li>
          <li>Light acceleration + light braking (listen for clunks / delay)</li>
          <li>Watch the dash for warnings or sensor errors</li>
        </ul>
      </div>

      {checks.map((c) => {
        const current = answers[c.id];
        const Icon = (c as any).icon;

        return (
          <section
            key={c.id}
            className="rounded-xl bg-slate-900/60 px-4 py-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-slate-400" />}
              <div className="text-sm font-medium text-slate-200">
                {c.title}
              </div>
            </div>

            <p className="text-xs text-slate-400">{c.guidance}</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(c.id, "ok")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border transition
                  ${
                    current?.value === "ok"
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : "border-white/20 text-slate-200 hover:bg-slate-800"
                  }`}
              >
                Seemed normal
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "concern")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border transition
                  ${
                    current?.value === "concern"
                      ? "bg-amber-400 text-black border-amber-300"
                      : "border-white/20 text-slate-200 hover:bg-slate-800"
                  }`}
              >
                Something stood out
              </button>

              <button
                type="button"
                onClick={() => setAnswer(c.id, "unsure")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs border transition
                  ${
                    current?.value === "unsure"
                      ? "bg-slate-300 text-black border-slate-300"
                      : "border-white/20 text-slate-200 hover:bg-slate-800"
                  }`}
              >
                Couldn’t check / not fitted
              </button>
            </div>

            {(current?.value === "concern" || current?.note) && (
              <textarea
                value={current?.note ?? ""}
                onChange={(e) => setNote(c.id, e.target.value)}
                placeholder="Optional notes"
                className="w-full rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-xs text-slate-200"
              />
            )}
          </section>
        );
      })}

      <div className="flex gap-2 pt-4">
        <button
          onClick={() => navigate("/scan/in-person/checks/inside")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          onClick={finishChecks}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold text-black"
        >
          Finish checks
        </button>
      </div>
    </div>
  );
}
