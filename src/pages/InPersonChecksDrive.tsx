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

  return parts
    .filter((p) => p.toLowerCase() !== lineToRemove.trim().toLowerCase())
    .join("\n");
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
        title: "Starting & low-speed behaviour",
        guidance:
          "When pulling away or manoeuvring slowly, did anything feel off? Think steering weight, smoothness, hesitation, or unexpected noises.",
        quickConcerns: [
          "Hesitation pulling away",
          "Steering feels heavy or vague",
          "Clunk or knock at low speed",
          "Warning light appeared",
        ],
        quickUnsure: ["Didn’t get to drive", "Only very brief movement"],
      },
      {
        id: "noise-hesitation",
        title: "Acceleration & cruising",
        guidance:
          "Under normal acceleration and steady driving, did the car feel smooth and predictable? Note any vibration, noise, or lack of response.",
        quickConcerns: [
          "Hesitation / lag",
          "Vibration at speed",
          "Unusual engine or drivetrain noise",
          "Harsh gear changes",
        ],
        quickUnsure: [
          "Couldn’t reach normal speed",
          "Very short or limited drive",
        ],
      },
      {
        id: "braking",
        title: "Braking feel",
        guidance:
          "During gentle braking, did the car slow smoothly and straight? You’re noticing feel and behaviour, not brake performance testing.",
        quickConcerns: [
          "Vibration when braking",
          "Pulls to one side",
          "Grinding or harsh noise",
          "Brake pedal feels inconsistent",
        ],
        quickUnsure: ["Didn’t need to brake", "Drive too limited"],
      },
      {
        id: "adas-systems",
        title: "Driver-assist systems & alerts (if fitted)",
        guidance:
          "If the car has driver-assist features, did they behave normally? Note any unexpected alerts, warnings, or system behaviour.",
        quickConcerns: [
          "Unexpected warning message",
          "Lane assist alert",
          "Parking sensor inconsistency",
          "Adaptive cruise issue",
        ],
        quickUnsure: ["Not fitted / unsure", "Didn’t test"],
      },
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  const steps = useMemo(
    () => [
      { key: "around", label: "Around" },
      { key: "inside", label: "Inside" },
      { key: "drive", label: "Drive" },
    ],
    []
  );

  const currentIndex = 2;
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next: Record<string, CheckAnswer> = { ...(prev ?? {}) };

      for (const c of checks) {
        if (!next[c.id]?.value) {
          next[c.id] = { ...(next[c.id] ?? {}), value: "ok" };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [checks]);

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
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={[
                "flex-1 text-center",
                i === currentIndex ? "text-slate-200 font-medium" : "",
                i < currentIndex ? "text-slate-300" : "",
              ].join(" ")}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Car className="h-5 w-5 text-slate-400 mt-1" />
        <div>
          <h1 className="text-2xl font-semibold text-white">After the drive</h1>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Answer based on what you noticed during normal driving. You’re not
            expected to test limits — just record anything that stood out.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selected = current?.value ?? "ok";
          const selectedLines = splitLines(current?.note);

          const chips =
            selected === "concern"
              ? c.quickConcerns
              : selected === "unsure"
              ? c.quickUnsure
              : [];

          return (
            <section
              key={c.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-5 space-y-4"
            >
              <div>
                <div className="text-sm font-semibold text-white">{c.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {c.guidance}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["ok", "concern", "unsure"] as AnswerValue[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setAnswer(c.id, v)}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold border transition",
                      selected === v
                        ? v === "ok"
                          ? "bg-emerald-500 text-black"
                          : v === "concern"
                          ? "bg-amber-400 text-black"
                          : "bg-slate-600 text-white"
                        : "bg-slate-950/30 text-slate-200 border-white/10 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {v === "ok"
                      ? "Looks fine"
                      : v === "concern"
                      ? "Something off"
                      : "Couldn’t check"}
                  </button>
                ))}
              </div>

              {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => {
                    const active = selectedLines.some(
                      (l) => l.toLowerCase() === chip.toLowerCase()
                    );
                    return (
                      <button
                        key={chip}
                        onClick={() => toggleChip(c.id, chip)}
                        className={[
                          "rounded-full px-3 py-1 text-xs border transition",
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
              )}

              {(selected !== "ok" || current?.note) && (
                <textarea
                  value={current?.note ?? ""}
                  onChange={(e) => setNote(c.id, e.target.value)}
                  placeholder="Optional note…"
                  className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-3 py-2 text-xs text-slate-200"
                  rows={3}
                />
              )}
            </section>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-slate-200"
        >
          Back
        </button>
        <button
          onClick={() => navigate("/scan/in-person/summary")}
          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
