// src/pages/InPersonChecksInsideCabin.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sofa } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

type CheckItem = {
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
    .filter((p) => p.toLowerCase() !== lineToRemove.toLowerCase())
    .join("\n");
}

function splitLines(note?: string) {
  return (note ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function InPersonChecksInsideCabin() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckItem[] = useMemo(
    () => [
      {
        id: "interior-smell",
        title: "Smell or moisture",
        guidance:
          "A damp or musty smell can hint at leaks, water entry, or poor storage.",
        quickConcerns: [
          "Musty smell",
          "Damp carpet",
          "Mould spots",
          "Strong smoke smell",
          "Aircon smell",
        ],
        quickUnsure: [
          "Raining / wet day",
          "Short inspection",
          "Couldn’t check boot area",
        ],
      },
      {
        id: "interior-condition",
        title: "General interior condition",
        guidance:
          "Normal wear is expected — you’re looking for unusually rough condition.",
        quickConcerns: [
          "Torn seat",
          "Sagging headliner",
          "Sticky buttons",
          "Worn steering wheel",
          "Cracked dash",
        ],
        quickUnsure: [
          "Didn’t check rear seats",
          "Low light",
          "Seat covers fitted",
        ],
      },
      {
        id: "seat-adjustment",
        title: "Seat adjustment & stability",
        guidance:
          "Adjust the driver’s seat slightly and check it feels secure and locks into position.",
        quickConcerns: [
          "Seat won’t adjust",
          "Seat rocks or feels loose",
          "Adjustment stuck",
          "Electric seat not responding",
        ],
        quickUnsure: ["Didn’t adjust seat", "Power not available"],
      },
      {
        id: "windows-operation",
        title: "Window operation",
        guidance:
          "If easy, test a window to confirm it moves smoothly without noises or sticking.",
        quickConcerns: [
          "Window slow",
          "Window stuck",
          "Grinding noise",
          "Regulator issue",
        ],
        quickUnsure: ["Didn’t test", "Power not available"],
      },
      {
        id: "mirrors-operation",
        title: "Mirror operation",
        guidance:
          "If fitted, check mirrors adjust correctly and feel secure.",
        quickConcerns: [
          "Mirror won’t adjust",
          "Mirror loose",
          "Folding mirror not working",
          "Cracked housing",
        ],
        quickUnsure: ["Didn’t test", "Power not available"],
      },
      {
        id: "seatbelts-trim",
        title: "Seatbelts & airbag trim",
        guidance:
          "Check belts retract smoothly and airbag trim looks intact and undisturbed.",
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
      step: "/scan/in-person/checks/inside",
      checks: answers,
    });
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
      <div className="flex items-start gap-3">
        <Sofa className="h-5 w-5 text-slate-400 mt-1" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Inside the cabin</h1>
          <p className="text-sm text-slate-400 mt-1">
            Quick checks for comfort, wear, and usability that can affect value.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selected = current?.value ?? "ok";
          const chips =
            selected === "concern"
              ? c.quickConcerns
              : selected === "unsure"
              ? c.quickUnsure
              : [];

          const selectedLines = splitLines(current?.note);

          return (
            <section
              key={c.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-5 space-y-4"
            >
              <div>
                <div className="text-sm font-semibold text-white">{c.title}</div>
                <p className="text-xs text-slate-400">{c.guidance}</p>
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

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => navigate("/scan/in-person/checks/around")}
          className="flex-1 rounded-2xl border border-white/15 bg-slate-950/30 px-4 py-3 text-slate-200"
        >
          Back
        </button>
        <button
          onClick={() => navigate("/scan/in-person/checks/drive-intro")}
          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
