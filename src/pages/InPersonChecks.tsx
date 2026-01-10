import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

type AnswerValue = "ok" | "concern" | "unsure";

type CheckAnswer = {
  value: AnswerValue;
  note?: string;
};

export default function InPersonChecks() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  /* =========================================================
     Session continuity
  ========================================================== */

  const [scanId] = useState<string>(() => {
    if (progress?.scanId) return progress.scanId;
    const id = generateScanId();
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId: id,
      step: "/scan/in-person/checks",
      startedAt: new Date().toISOString(),
    });
    return id;
  });

  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>(
    progress?.checks ?? {}
  );

  useEffect(() => {
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/checks",
      checks: answers,
      startedAt: progress?.startedAt ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId, answers]);

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

  /* =========================================================
     Zones & checks (unchanged)
  ========================================================== */

  const zones = [
    {
      id: "around-car",
      title: "Around the car",
      intro: "Walk around the vehicle and note any obvious observations.",
      checks: [
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
      ],
    },
    {
      id: "inside-cabin",
      title: "Inside the cabin",
      intro: "Focus on the interior environment and condition.",
      checks: [
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
      ],
    },
    {
      id: "test-drive",
      title: "Short drive (if allowed)",
      intro: "If permitted, note how the car feels to drive.",
      checks: [
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
      ],
    },
  ];

  function continueToSummary() {
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/summary",
      checks: answers,
    });

    navigate("/scan/in-person/summary");
  }

  /* =========================================================
     UI
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Condition checks
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Guided condition checks
      </h1>

      <p className="text-[11px] text-slate-400">
        You’re partway through an inspection. You can leave and return at any time.
      </p>

      {zones.map((zone) => (
        <section
          key={zone.id}
          className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-4"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              {zone.title}
            </h2>
            <p className="text-xs text-slate-400">{zone.intro}</p>
          </div>

          {zone.checks.map((check) => {
            const current = answers[check.id];

            return (
              <div
                key={check.id}
                className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3 space-y-2"
              >
                <div className="text-sm text-slate-200">{check.title}</div>
                <p className="text-xs text-slate-400">{check.guidance}</p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setAnswer(check.id, "ok")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                      current?.value === "ok"
                        ? "bg-emerald-500 text-black"
                        : "bg-slate-900 text-slate-200 border-white/20"
                    }`}
                  >
                    Seemed normal
                  </button>
                  <button
                    onClick={() => setAnswer(check.id, "concern")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                      current?.value === "concern"
                        ? "bg-amber-400 text-black"
                        : "bg-slate-900 text-slate-200 border-white/20"
                    }`}
                  >
                    Something stood out
                  </button>
                  <button
                    onClick={() => setAnswer(check.id, "unsure")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs border ${
                      current?.value === "unsure"
                        ? "bg-slate-600 text-white"
                        : "bg-slate-900 text-slate-200 border-white/20"
                    }`}
                  >
                    Couldn’t check
                  </button>
                </div>

                {(current?.value === "concern" || current?.note) && (
                  <textarea
                    value={current?.note ?? ""}
                    onChange={(e) => setNote(check.id, e.target.value)}
                    placeholder="Add a note (optional)…"
                    className="w-full mt-2 rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-xs text-slate-200"
                  />
                )}
              </div>
            );
          })}
        </section>
      ))}

      <button
        onClick={continueToSummary}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Finish inspection & view summary
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity helps you record what you noticed — not diagnose faults.
      </p>
    </div>
  );
}
