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

export default function InPersonChecksDrive() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckConfig[] = useMemo(
    () => [
      {
        id: "steering",
        title: "Steering & handling feel",
        guidance:
          "On a safe short drive: does it track straight? Any vibration, pulling, or knocking?",
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
          "Any hesitation, harsh shifting, unusual noises, or warning lights during acceleration?",
        quickConcerns: [
          "Hesitation / lag",
          "Harsh gear changes",
          "Unusual engine noise",
          "Warning light appeared",
        ],
        quickUnsure: [
          "Couldn’t test acceleration",
          "Short / low-speed drive only",
        ],
      },
      {
        id: "aircon-drive",
        title: "Air conditioning (during drive)",
        guidance:
          "After a few minutes of driving, turn the aircon on full cold. Then briefly test warm. You’re checking cooling strength, smells, and noise under load.",
        quickConcerns: [
          "Not blowing cold after a few minutes",
          "Weak cooling",
          "Bad / musty smell",
          "Loud fan or compressor noise",
          "Takes a long time to cool",
        ],
        quickUnsure: [
          "Didn’t drive long enough",
          "Forgot to test",
          "Weather made it hard to tell",
        ],
      },
      {
        id: "adas-systems",
        title: "Driver-assist systems (if fitted)",
        guidance:
          "If fitted: do driver-assist features behave normally? Any unexpected alerts, warnings, or sensor issues?",
        quickConcerns: [
          "Warning message",
          "Blind spot monitor issue",
          "Parking sensors inconsistent",
          "Adaptive cruise issue",
          "Lane assist alert",
        ],
        quickUnsure: ["Not fitted / unsure", "Didn’t test"],
      },
    ],
    []
  );

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
     Auto-save defaults so "Looks fine" isn't just visual
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

      <div className="flex items-start gap-3 pt-1">
        <div className="mt-1">
          <Car className="h-5 w-5 text-slate-400" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white">During the drive</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            A test drive is strongly recommended before purchase. If you weren’t
            allowed to drive it, mark “Couldn’t check” so the report treats it as
            an unknown.
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

      {/* NAVIGATION */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-slate-200 font-semibold transition"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/summary")}
          className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
