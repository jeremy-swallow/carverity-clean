// src/pages/InPersonChecks.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

export default function InPersonChecks() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  // 🔐 Guarantee session continuity
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

  const imperfectionsFromPhotos = progress?.imperfections ?? [];

  useEffect(() => {
    // Persist arrival to this step
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/checks",
      startedAt: progress?.startedAt ?? new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  /* =========================================================
     Guided condition awareness checks
  ========================================================== */

  const checks = [
    {
      id: "tyre-tread",
      title: "Tyre tread & wear pattern",
      guidance:
        "Look for even wear across the tyre. Very low tread or heavy edging wear may simply mean tyres are due soon — ask the seller when they were last replaced.",
    },
    {
      id: "brakes-visible",
      title: "Brake discs visible through wheels",
      guidance:
        "Light surface rust after rain is normal. Deep scoring or grooves may be worth asking the seller about.",
    },
    {
      id: "warning-lights",
      title: "Any warning lights showing on the dash?",
      guidance:
        "If lights are showing, photograph the dashboard and ask when it was last inspected or serviced.",
    },
    {
      id: "aircon",
      title: "Air-conditioning blowing cold?",
      guidance:
        "Weak or warm airflow doesn’t always mean a major issue — ask when it was last serviced or re-gassed.",
    },
    {
      id: "odour-interior",
      title: "Moisture, damp smell, or mould?",
      guidance:
        "Could be from recent cleaning — or may indicate past water entry. Ask for clarification if unsure.",
    },
    {
      id: "seatbelts-trim",
      title: "Seatbelts and airbag trim intact?",
      guidance:
        "Frayed belts or loose airbag trim are worth confirming with the seller — especially if the car has been previously repaired.",
    },
    {
      id: "engine-bay-visual",
      title: "Quick visual check under bonnet (do not touch)",
      guidance:
        "Look only — don’t open caps. Check for obvious leaks, loose wiring or unusual smells. If unsure, ask the seller or a mechanic to review.",
    },
    {
      id: "adas-features",
      title: "Safety / driver-assist features present?",
      guidance:
        "If the car lists features like reversing camera, parking sensors or lane-assist, check that they appear to be fitted and active where possible.",
    },
    {
      id: "test-drive",
      title: "Short test-drive impressions (if allowed)",
      guidance:
        "Listen for knocks, steering pulling, vibration or hesitation. These aren’t faults by themselves — they’re simply things worth confirming.",
    },
  ];

  const [answers, setAnswers] = useState<Record<string, string>>({});

  function setAnswer(id: string, value: string) {
    setAnswers((p) => ({ ...p, [id]: value }));
  }

  /* =========================================================
     Continue → summary
  ========================================================== */

  function continueToSummary() {
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId,
      step: "/scan/in-person/summary",
      imperfections: imperfectionsFromPhotos,
      checks: answers,
    });

    navigate("/scan/in-person/summary");
  }

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Condition checks
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Final checks before finishing your inspection
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100">
          Quick real-world condition checks
        </h2>

        {checks.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-white/10 bg-slate-800/50 px-4 py-3 space-y-1"
          >
            <div className="text-sm text-slate-200">{c.title}</div>
            <p className="text-xs text-slate-400">{c.guidance}</p>

            <select
              value={answers[c.id] ?? ""}
              onChange={(e) => setAnswer(c.id, e.target.value)}
              className="w-full mt-1 rounded-lg bg-slate-900 border border-white/20 px-3 py-2 text-sm text-slate-200"
            >
              <option value="">Select an answer…</option>
              <option value="No — everything seemed normal">
                No — everything seemed normal
              </option>
              <option value="Something seemed unusual — worth confirming">
                Something seemed unusual — worth confirming
              </option>
              <option value="Unsure / could not check">
                Unsure / could not check
              </option>
            </select>
          </div>
        ))}
      </section>

      <button
        onClick={continueToSummary}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Finish inspection & view summary
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        CarVerity doesn’t label findings as faults — it helps you document
        observations and decide what to confirm with the seller.
      </p>
    </div>
  );
}
