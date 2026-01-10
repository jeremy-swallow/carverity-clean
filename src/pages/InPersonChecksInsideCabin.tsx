import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

export default function InPersonChecksInsideCabin() {
  const navigate = useNavigate();
  const progress: any = loadProgress();
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

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
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-xl font-semibold text-white">
        Inside the cabin
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
              <button onClick={() => setAnswer(c.id, "ok")} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-xs">
                Seemed normal
              </button>
              <button onClick={() => setAnswer(c.id, "concern")} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-xs">
                Something stood out
              </button>
              <button onClick={() => setAnswer(c.id, "unsure")} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-xs">
                Couldn’t check
              </button>
            </div>

            {(current?.value === "concern" || current?.note) && (
              <textarea
                value={current?.note ?? ""}
                onChange={(e) => setNote(c.id, e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-xs text-slate-200"
              />
            )}
          </section>
        );
      })}

      <button
        onClick={() => navigate("/scan/in-person/checks/drive")}
        className="w-full rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
      >
        Continue
      </button>
    </div>
  );
}
