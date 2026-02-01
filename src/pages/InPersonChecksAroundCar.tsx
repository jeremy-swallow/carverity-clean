import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Camera } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

type StepPhoto = {
  id: string;
  dataUrl: string;
  stepId: string;
};

type CheckConfig = {
  id: string;
  title: string;
  guidance: string;
  quickConcerns: string[];
  quickUnsure: string[];
  allowPhoto?: boolean;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function splitLines(note?: string) {
  return (note ?? "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
}

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

  return base
    .split("\n")
    .map((p) => p.trim())
    .filter(
      (p) => p.toLowerCase() !== lineToRemove.trim().toLowerCase()
    )
    .join("\n");
}

export default function InPersonChecksAroundCar() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const checks: CheckConfig[] = useMemo(
    () => [
      {
        id: "body-panels-paint",
        title: "Body panels & paint",
        guidance:
          "Inspect as much of the car’s exterior as you can. Partial views are OK if space is tight — look for mismatched paint, uneven gaps, dents, or signs of repair in the visible areas.",
        quickConcerns: [
          "Scratches or scuffs",
          "Dents",
          "Paint mismatch",
          "Overspray",
          "Panel gaps uneven",
        ],
        quickUnsure: [
          "Cars parked too close together",
          "Poor lighting",
          "Car dirty",
          "Hard to see clearly",
        ],
      },
      {
        id: "headlights-condition",
        title: "Headlights condition",
        guidance:
          "Check the visible lens surfaces for clouding, cracks, or moisture. If access is limited, assess what you can see.",
        allowPhoto: true,
        quickConcerns: [
          "Cloudy / yellowed",
          "Cracked lens",
          "Moisture inside",
        ],
        quickUnsure: [
          "Cars parked too close together",
          "Hard to tell in shade",
          "Didn’t inspect closely",
        ],
      },
      {
        id: "windscreen-damage",
        title: "Windscreen damage",
        guidance:
          "Check the accessible areas of the windscreen for chips or cracks. Even small chips can spread.",
        allowPhoto: true,
        quickConcerns: [
          "Stone chip",
          "Crack forming",
          "Damage in driver view",
        ],
        quickUnsure: [
          "Cars parked too close together",
          "Glare",
          "Couldn’t see clearly",
        ],
      },
      {
        id: "tyre-wear",
        title: "Tyre wear & tread",
        guidance:
          "Inspect the tyres you can access. Look for even wear across the visible tyres.",
        quickConcerns: [
          "Uneven wear",
          "Low tread",
          "Different tyre brands",
        ],
        quickUnsure: [
          "Cars parked too close together",
          "Didn’t check all tyres",
        ],
      },
      {
        id: "brakes-visible",
        title: "Brake discs (if visible)",
        guidance:
          "If you can see the brake discs through the wheels, look for heavy wear or grooves. Limited visibility is common in car yards.",
        quickConcerns: [
          "Heavy lip on disc",
          "Deep grooves",
          "Looks heavily worn",
        ],
        quickUnsure: [
          "Cars parked too close together",
          "Hard to see behind wheels",
        ],
      },
    ],
    []
  );

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  const [photos, setPhotos] = useState<StepPhoto[]>(
    Array.isArray(progress?.photos) ? progress.photos : []
  );

  /* -------------------------------------------------------
     Auto-fill missing answers as OK (never overwrite)
  ------------------------------------------------------- */
  useEffect(() => {
    setAnswers((prev) => {
      let changed = false;
      const next = { ...(prev ?? {}) };

      for (const c of checks) {
        if (!next[c.id]?.value) {
          next[c.id] = { ...(next[c.id] ?? {}), value: "ok" };
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [checks]);

  /* -------------------------------------------------------
     Persist progress
  ------------------------------------------------------- */
  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      step: "/scan/in-person/checks/around",
      checks: answers,
      photos,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, photos]);

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], value } }));
  }

  function setNote(id: string, note: string) {
    setAnswers((p) => ({ ...p, [id]: { ...p[id], note } }));
  }

  function toggleChip(id: string, chip: string) {
    setAnswers((p) => {
      const prev = p[id] ?? { value: "ok" as AnswerValue, note: "" };
      const lines = splitLines(prev.note);
      const active = lines.some(
        (l) => l.toLowerCase() === chip.toLowerCase()
      );

      const nextNote = active
        ? removeLine(prev.note, chip)
        : mergeNote(prev.note, chip);

      return { ...p, [id]: { ...prev, note: nextNote } };
    });
  }

  function addPhoto(stepId: string, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((p) => [
        ...p,
        {
          id: uid(),
          stepId,
          dataUrl: reader.result as string,
        },
      ]);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-start gap-3">
        <Car className="h-5 w-5 text-slate-400 mt-1" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Around the car</h1>
          <p className="text-sm text-slate-400 mt-1">
            Walk around the vehicle and record what you can realistically see.
            Partial views are fine if space is limited.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {checks.map((c) => {
          const current = answers[c.id];
          const selectedValue = current?.value ?? "ok";
          const selectedLines = splitLines(current?.note);

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
              <div>
                <div className="text-sm font-semibold text-white">
                  {c.title}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {c.guidance}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAnswer(c.id, "ok")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold border",
                    selectedValue === "ok"
                      ? "bg-emerald-500 text-black border-emerald-400/30"
                      : "bg-slate-950/30 text-slate-200 border-white/10",
                  ].join(" ")}
                >
                  Looks fine
                </button>

                <button
                  onClick={() => setAnswer(c.id, "concern")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold border",
                    selectedValue === "concern"
                      ? "bg-amber-400 text-black border-amber-300/40"
                      : "bg-slate-950/30 text-slate-200 border-white/10",
                  ].join(" ")}
                >
                  Something off
                </button>

                <button
                  onClick={() => setAnswer(c.id, "unsure")}
                  className={[
                    "rounded-xl px-3 py-2 text-xs font-semibold border",
                    selectedValue === "unsure"
                      ? "bg-slate-600 text-white border-slate-400/30"
                      : "bg-slate-950/30 text-slate-200 border-white/10",
                  ].join(" ")}
                >
                  Couldn’t check
                </button>
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

              {(selectedValue !== "ok" || current?.note) && (
                <textarea
                  value={current?.note ?? ""}
                  onChange={(e) => setNote(c.id, e.target.value)}
                  placeholder="Add a short note (optional)…"
                  className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-3 py-2 text-xs text-slate-200"
                  rows={3}
                />
              )}

              {c.allowPhoto && (
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
                  <Camera className="h-4 w-4" />
                  Add photo (best available view)
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addPhoto(c.id, f);
                    }}
                  />
                </label>
              )}
            </section>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/scan/in-person/checks/inside")}
        className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
      >
        Continue
      </button>
    </div>
  );
}
