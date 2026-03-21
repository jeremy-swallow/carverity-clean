// src/pages/InPersonChecksDrive.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value?: AnswerValue; note?: string };

type CheckConfig = {
  id: string;
  group: string;
  title: string;
  prompt: string;
  reassurance: string;
  okLabel: string;
  concernLabel: string;
  unsureLabel: string;
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

function answerTone(value?: AnswerValue) {
  if (value === "ok") {
    return {
      card: "border-emerald-500/20 bg-emerald-500/8",
      badge: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
      icon: "text-emerald-300",
    };
  }

  if (value === "concern") {
    return {
      card: "border-amber-500/20 bg-amber-500/8",
      badge: "bg-amber-500/10 text-amber-200 border-amber-500/20",
      icon: "text-amber-300",
    };
  }

  if (value === "unsure") {
    return {
      card: "border-sky-500/20 bg-sky-500/8",
      badge: "bg-sky-500/10 text-sky-200 border-sky-500/20",
      icon: "text-sky-300",
    };
  }

  return {
    card: "border-white/10 bg-slate-900/60",
    badge: "bg-white/5 text-slate-300 border-white/10",
    icon: "text-slate-300",
  };
}

function getPromptCopy(value?: AnswerValue) {
  if (value === "ok") {
    return "Good — only use this when the drive felt normal enough that nothing stood out here.";
  }

  if (value === "concern") {
    return "Record what felt off. You are capturing the signal, not diagnosing the car.";
  }

  if (value === "unsure") {
    return "That is a valid answer. CarVerity will treat this as not fully assessed, not as a hidden negative.";
  }

  return "Choose the option that best matches what you actually noticed. It is okay to be unsure.";
}

export default function InPersonChecksDrive() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckConfig[] = useMemo(
    () => [
      {
        id: "steering",
        group: "Getting moving",
        title: "Steering feel at low speed",
        prompt:
          "When pulling away, turning slowly, or manoeuvring, did the steering feel normal and settled?",
        reassurance:
          "If you barely moved the car or did not get enough time to notice, marking unsure is the safer choice.",
        okLabel: "Felt normal",
        concernLabel: "Something felt off",
        unsureLabel: "Not sure / didn’t notice",
        quickConcerns: [
          "Steering feels heavy or vague",
          "Clunk or knock at low speed",
          "Hesitation pulling away",
          "Warning light appeared",
        ],
        quickUnsure: ["Didn’t get to drive", "Only very brief movement"],
      },
      {
        id: "noise-hesitation",
        group: "While driving",
        title: "Response, smoothness & unusual noise",
        prompt:
          "During normal acceleration and cruising, did the car feel smooth and predictable?",
        reassurance:
          "You are not testing limits here. Just note whether anything felt hesitant, noisy, rough or unexpectedly unsettled.",
        okLabel: "Felt normal",
        concernLabel: "Something stood out",
        unsureLabel: "Not sure / limited drive",
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
        group: "Slowing down",
        title: "Braking feel and control",
        prompt:
          "When slowing down normally, did the braking feel smooth, controlled and straight?",
        reassurance:
          "You do not need to test braking hard. Normal slowing is enough to notice if something feels wrong.",
        okLabel: "Felt normal",
        concernLabel: "Something felt off",
        unsureLabel: "Not sure / didn’t really test",
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
        group: "Driver systems",
        title: "Driver-assist systems & alerts",
        prompt:
          "If this car has driver-assist features fitted, did they behave normally during the drive?",
        reassurance:
          "If the car does not have these systems, or you did not get a real chance to notice them, choose unsure rather than guessing.",
        okLabel: "Nothing odd noticed",
        concernLabel: "Unexpected warning / behaviour",
        unsureLabel: "Not sure / not tested",
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

  const answeredCount = useMemo(
    () => checks.filter((c) => Boolean(answers[c.id]?.value)).length,
    [checks, answers]
  );

  const concernCount = useMemo(
    () => checks.filter((c) => answers[c.id]?.value === "concern").length,
    [checks, answers]
  );

  const unsureCount = useMemo(
    () => checks.filter((c) => answers[c.id]?.value === "unsure").length,
    [checks, answers]
  );

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
      const prev = p[id] ?? {};
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
          <p className="text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">
            Record what stood out during normal driving. You do not need to
            answer everything perfectly — just capture what felt fine, what felt
            off, and what you could not really judge.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-[220px] flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Observation-first
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              This is about what you noticed — not about getting every answer
              “right”
            </h2>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-2xl">
              If something felt normal, mark it and move on. If something felt
              off, record that. If the drive was too limited to tell, choose
              unsure. CarVerity will treat that as not assessed, not as a hidden
              fault.
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <p className="text-sm text-slate-200 leading-relaxed">
                Buyer-safe rule: the app only works from what you actually
                noticed. Missing or uncertain items stay visible as uncertainty.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[220px] rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Drive snapshot
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Answered</span>
                <span className="font-semibold text-white tabular-nums">
                  {answeredCount} / {checks.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Concern signals</span>
                <span className="font-semibold text-white tabular-nums">
                  {concernCount}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-400">Unsure / limited</span>
                <span className="font-semibold text-white tabular-nums">
                  {unsureCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-slate-300 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed">
            Keep this practical. You are not trying to diagnose the whole car —
            just record anything that felt reassuring, questionable, or too
            limited to judge properly.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Drive checks</span>
          <span>
            {answeredCount} of {checks.length} answered
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selected = current?.value;
          const selectedLines = splitLines(current?.note);

          const chips =
            selected === "concern"
              ? c.quickConcerns
              : selected === "unsure"
              ? c.quickUnsure
              : [];

          const tone = answerTone(selected);

          return (
            <section
              key={c.id}
              className={[
                "rounded-2xl border px-5 py-5 space-y-4 transition",
                tone.card,
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-[220px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">
                      {c.group}
                    </span>

                    {selected && (
                      <span
                        className={[
                          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          tone.badge,
                        ].join(" ")}
                      >
                        {selected === "ok" ? (
                          <CheckCircle2 className={["h-3.5 w-3.5", tone.icon].join(" ")} />
                        ) : selected === "concern" ? (
                          <AlertTriangle className={["h-3.5 w-3.5", tone.icon].join(" ")} />
                        ) : (
                          <CircleHelp className={["h-3.5 w-3.5", tone.icon].join(" ")} />
                        )}
                        {selected === "ok"
                          ? "Recorded as reassuring"
                          : selected === "concern"
                          ? "Recorded as concern"
                          : "Recorded as unsure"}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-base font-semibold text-white">
                    {c.title}
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    {c.prompt}
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {c.reassurance}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    {c.id === "steering" ? (
                      <Gauge className="h-4 w-4" />
                    ) : c.id === "braking" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : c.id === "adas-systems" ? (
                      <CircleHelp className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="text-xs text-slate-400">What did you notice?</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { value: "ok", label: c.okLabel },
                    { value: "concern", label: c.concernLabel },
                    { value: "unsure", label: c.unsureLabel },
                  ] as { value: AnswerValue; label: string }[]
                ).map((option) => {
                  const active = selected === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAnswer(c.id, option.value)}
                      className={[
                        "rounded-xl px-3 py-3 text-sm font-semibold border transition text-left",
                        active
                          ? option.value === "ok"
                            ? "bg-emerald-500 text-black border-emerald-400/30"
                            : option.value === "concern"
                            ? "bg-amber-400 text-black border-amber-300/40"
                            : "bg-sky-500 text-black border-sky-300/40"
                          : "bg-slate-950/30 text-slate-200 border-white/10 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {getPromptCopy(selected)}
                </p>
              </div>

              {chips.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Helpful details
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
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
                            "rounded-full px-3 py-1 text-xs border transition",
                            active
                              ? selected === "concern"
                                ? "bg-amber-400/20 border-amber-300/40 text-amber-100"
                                : "bg-sky-500/20 border-sky-300/40 text-sky-100"
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

              {(selected === "concern" ||
                selected === "unsure" ||
                current?.note) && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Optional note
                  </p>
                  <textarea
                    value={current?.note ?? ""}
                    onChange={(e) => setNote(c.id, e.target.value)}
                    placeholder="Add anything worth remembering later…"
                    className="mt-2 w-full rounded-xl bg-slate-950/40 border border-white/10 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                    rows={3}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-slate-200 inline-flex items-center justify-center gap-2 hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={() => navigate("/scan/in-person/summary")}
          className="flex-1 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold text-black inline-flex items-center justify-center gap-2"
        >
          Continue to summary
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}