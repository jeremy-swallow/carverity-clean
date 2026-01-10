import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gauge } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type AnswerValue = "ok" | "concern" | "unsure";
type CheckAnswer = { value: AnswerValue; note?: string };

export default function InPersonChecksDrive() {
  const navigate = useNavigate();
  const progress: any = loadProgress();
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
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

  const checks = [
    {
      id: "steering-feel",
      title: "Steering & handling",
      guidance: "Notice pulling or vibration.",
    },
    {
      id: "noise-vibration",
      title: "Noise or hesitation",
      guidance: "Listen for unusual sounds.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <Gauge className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-white">
          Short drive (if allowed)
        </h1>
      </div>

      {checks.map((c) => {
        const current = answers[c.id];
        return (
          <section
            key={c.id}
            className="rounded-xl bg-slate-900/60 px-4 py-3 space-y-2"
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
        onClick={() => navigate("/scan/in-person/summary")}
        className="w-full rounded-xl bg-emerald-500 text-black font-semibold px-4 py-3"
      >
        Finish checks
      </button>
    </div>
  );
}
