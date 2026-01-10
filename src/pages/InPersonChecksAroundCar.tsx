import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

export default function InPersonChecksAroundCar() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

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

  const checks = [
    {
      id: "tyre-wear",
      title: "Tyre wear & tread",
      guidance: "Look for even wear across each tyre.",
    },
    {
      id: "brakes-visible",
      title: "Brake discs (if visible)",
      guidance: "Light surface rust is normal.",
    },
    {
      id: "seatbelts-trim",
      title: "Seatbelts and airbag trim",
      guidance: "Check for fraying or damage.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-xl font-semibold text-white">
        Around the car
      </h1>

      {checks.map((c) => {
        const current = answers[c.id];
        return (
          <section
            key={c.id}
            className="rounded-xl border border-white/12 bg-slate-900/70 px-4 py-3 space-y-2"
          >
            <div className="text-sm text-slate-200">{c.title}</div>
            <p className="text-xs text-slate-400">{c.guidance}</p>

            <div className="flex gap-2">
              <button
                onClick={() => setAnswer(c.id, "ok")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                  current?.value === "ok"
                    ? "bg-emerald-500 text-black"
                    : "border border-white/20 text-slate-200"
                }`}
              >
                Seemed normal
              </button>
              <button
                onClick={() => setAnswer(c.id, "concern")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                  current?.value === "concern"
                    ? "bg-amber-400 text-black"
                    : "border border-white/20 text-slate-200"
                }`}
              >
                Something stood out
              </button>
              <button
                onClick={() => setAnswer(c.id, "unsure")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                  current?.value === "unsure"
                    ? "bg-slate-600 text-white"
                    : "border border-white/20 text-slate-200"
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
                className="w-full rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-xs text-slate-200"
              />
            )}
          </section>
        );
      })}

      <button
        onClick={() => navigate("/scan/in-person/checks/inside")}
        className="w-full rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
      >
        Continue
      </button>
    </div>
  );
}
