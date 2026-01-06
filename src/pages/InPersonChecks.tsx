// src/pages/InPersonChecks.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";
import { saveProgress, loadProgress } from "../utils/scanProgress";

type FollowUpPhoto = {
  id: string;
  label: string;
  reason: string;
  completed: boolean;
};

export default function InPersonChecks() {
  const navigate = useNavigate();
  const progress = loadProgress();
  const [onlineResult, setOnlineResult] = useState<SavedResult | null>(null);

  const imperfectionsFromPhotos =
    (progress as any)?.imperfections ?? [];

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);

    // Persist “mid-journey”
    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      step: "/scan/in-person/checks",
      startedAt: progress?.startedAt ?? new Date().toISOString(),
    });
  }, []);

  /* =========================================================
     Build follow-up photo suggestions from online scan
  ========================================================== */

  const followUps = useMemo<FollowUpPhoto[]>(() => {
    if (!onlineResult?.fullSummary && !onlineResult?.summary) return [];

    const text =
      (onlineResult.fullSummary || onlineResult.summary || "").toLowerCase();

    const map: Record<string, string> = {
      dent: "Possible dent mentioned — capture a clear close-up to confirm size and location.",
      scratch:
        "Scratch noted in listing — take a photo from both normal and close distance.",
      rust: "Rust reference — photograph the affected area and nearby seams.",
      tyre: "Tyre condition mentioned — capture tread and sidewall clearly.",
      chip: "Chip mentioned — take a close-up and wider context shot.",
      wheel: "Wheel mark noted — capture rim condition clearly.",
      interior:
        "Interior wear mentioned — photograph the exact seat / trim area.",
    };

    const results: FollowUpPhoto[] = [];

    Object.entries(map).forEach(([keyword, reason]) => {
      if (text.includes(keyword)) {
        results.push({
          id: crypto.randomUUID(),
          label: keyword === "interior" ? "Interior detail" : `Verify ${keyword}`,
          reason,
          completed: false,
        });
      }
    });

    return results;
  }, [onlineResult]);

  const [followUpList, setFollowUpList] =
    useState<FollowUpPhoto[]>(followUps);

  function markCompleted(id: string) {
    setFollowUpList((p) =>
      p.map((f) => (f.id === id ? { ...f, completed: true } : f))
    );
  }

  /* =========================================================
     Simple condition-awareness checks
  ========================================================== */

  const checks = [
    {
      id: "test-drive-sounds",
      title: "Any unusual sounds when driving?",
      guidance:
        "Clicks, knocks or grinding noises may not be faults — they’re simply things worth asking the seller about.",
    },
    {
      id: "warning-lights",
      title: "Any warning lights showing on the dash?",
      guidance:
        "If lights are present, photograph the dashboard and ask when it was last inspected.",
    },
    {
      id: "odour-interior",
      title: "Strong interior smells or moisture?",
      guidance:
        "Moisture may indicate leaks or past water entry — ask for explanation or receipts if unsure.",
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
      step: "/scan/in-person/summary",
      imperfections: imperfectionsFromPhotos,
      followUpPhotos: followUpList,
      checks: answers,
      fromOnlineScan: Boolean(onlineResult),
    });

    navigate("/scan/in-person/summary");
  }

  /* =========================================================
     Render
  ========================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Condition checks & follow-ups
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Final checks before finishing your inspection
      </h1>

      {/* Follow-up photos from online scan */}
      {followUpList.length > 0 && (
        <section className="rounded-2xl border border-indigo-400/25 bg-indigo-600/10 px-5 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-indigo-200">
            Suggested extra photos (based on your online scan)
          </h2>

          <p className="text-xs md:text-sm text-slate-300">
            These aren’t faults — they’re simply areas **worth confirming in person**.
          </p>

          <ul className="space-y-2 mt-2">
            {followUpList.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2 flex items-center justify-between"
              >
                <div className="text-sm text-slate-200">
                  <strong>{f.label}</strong>
                  <div className="text-slate-400 text-xs">{f.reason}</div>
                </div>

                {!f.completed ? (
                  <button
                    onClick={() => markCompleted(f.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-400 text-black text-sm font-semibold"
                  >
                    Mark photo taken
                  </button>
                ) : (
                  <span className="text-xs text-emerald-300">
                    ✓ Captured
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Condition awareness checks */}
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

      {/* Continue */}
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
