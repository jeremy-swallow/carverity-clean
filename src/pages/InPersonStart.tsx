// src/pages/InPersonStart.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

export default function InPersonStart() {
  const navigate = useNavigate();
  const [onlineResult, setOnlineResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    // If the user previously completed an online scan, load it
    const stored = loadOnlineResults();
    if (stored) setOnlineResult(stored);
  }, []);

  const imperfectionHints = useMemo(() => {
    if (!onlineResult?.fullSummary && !onlineResult?.summary) return [];

    const text =
      onlineResult.fullSummary ||
      onlineResult.summary ||
      "";

    const keywords = [
      "dent",
      "scrape",
      "scratch",
      "stone chip",
      "chip",
      "paint fade",
      "oxidation",
      "curb rash",
      "kerb rash",
      "wheel damage",
      "wear",
      "tear",
      "crack",
      "scuff",
      "blemish",
      "hail",
      "rust",
      "corrosion",
      "panel gap",
      "misaligned panel",
    ];

    const lowered = text.toLowerCase();
    const matches = keywords.filter((k) => lowered.includes(k));

    // Deduplicate + tidy language
    return Array.from(new Set(matches)).map((m) => m.replace(/^\w/, (c) => c.toUpperCase()));
  }, [onlineResult]);

  function startScan() {
    navigate("/scan/in-person/start");
  }

  function viewOnlineResults() {
    navigate("/online-results");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      {/* Step context */}
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person scan — Stage 2 of the CarVerity journey
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Start your in-person inspection
      </h1>

      {/* Dynamic guidance block */}
      {onlineResult ? (
        <section className="rounded-2xl border border-indigo-400/25 bg-indigo-600/10 px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-100">
            <span>🔗</span>
            <h2 className="text-sm md:text-base font-semibold">
              Linked to your online scan
            </h2>
          </div>

          <p className="text-sm text-slate-300">
            This in-person scan helps you **verify details in real-life** based
            on the listing you already scanned. We’ll guide you to capture
            photos and observations so you can feel confident before deciding.
          </p>

          {imperfectionHints.length > 0 ? (
            <div className="rounded-xl border border-white/12 bg-slate-900/70 px-4 py-3">
              <p className="text-sm text-slate-200 font-semibold mb-1">
                Suggested priority photos to take first
              </p>

              <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
                {imperfectionHints.map((m, i) => (
                  <li key={i}>
                    Capture clear photos of **possible {m.toLowerCase()} areas**
                    so you can review them later or discuss with the seller.
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-slate-400 mt-2">
                These aren’t faults — they’re simply things **worth confirming
                in person**.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/12 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
              No concerns were highlighted in the online scan — this in-person
              stage focuses on **verifying condition, photos, and real-world
              impressions**.
            </div>
          )}

          <button
            onClick={viewOnlineResults}
            className="mt-1 text-xs underline text-slate-300"
          >
            View the online report again
          </button>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/15 bg-slate-900/70 px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-100">
            <span>📸</span>
            <h2 className="text-sm md:text-base font-semibold">
              Stand-alone in-person inspection
            </h2>
          </div>

          <p className="text-sm text-slate-300">
            Even without an online listing scan, CarVerity will guide you to
            capture photos, note imperfections, and understand **what’s worth
            confirming or budgeting for**.
          </p>

          <div className="rounded-xl border border-white/12 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
            You’ll be prompted to photograph:
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Body panels and paint condition</li>
              <li>Interior wear and dashboard condition</li>
              <li>Tyres, wheels and brake visibility</li>
              <li>Any dents, scratches or marks you notice</li>
            </ul>
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="pt-2">
        <button
          onClick={startScan}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
        >
          Continue — begin guided photo inspection
        </button>

        <p className="mt-2 text-[11px] text-slate-400 text-center">
          This isn’t a mechanical inspection — it’s guidance to support your
          decision-making.
        </p>
      </div>
    </div>
  );
}
