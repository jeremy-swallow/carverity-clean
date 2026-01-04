// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_full_unlock";

/* =========================================================
   Small UI helpers
========================================================= */

function SectionCard({ title, id, icon, children }: {
  title: string;
  id: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_0_18px_rgba(0,0,0,0.25)] backdrop-blur-sm px-5 py-5 md:px-7 md:py-6 space-y-3 scroll-mt-24 transition-all hover:shadow-[0_0_28px_rgba(0,0,0,0.35)]"
    >
      <h2 className="flex items-center gap-2 text-xs md:text-sm tracking-wide font-semibold text-slate-200">
        {icon && <span className="text-base">{icon}</span>}
        {title.toUpperCase()}
      </h2>
      {children}
    </section>
  );
}

/* =========================================================
   Unlock test
========================================================= */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setResult(stored);
  }, []);

  function unlockForTesting() {
    if (!result) return;
    const updated: SavedResult = { ...result, isUnlocked: true };
    saveOnlineResults(updated);
    localStorage.setItem(UNLOCK_KEY, "1");
    setResult(updated);
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-300">
        No scan data found
      </div>
    );
  }

  const { summary, previewSummary, fullSummary, isUnlocked } = result;
  const reportText = fullSummary || summary || "";
  const hasStoredUnlock = localStorage.getItem(UNLOCK_KEY) === "1";
  const showUnlocked = (isUnlocked ?? hasStoredUnlock) === true;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* ===== Locked Premium Preview ===== */}
      {!showUnlocked && (
        <SectionCard id="analysis" title="CarVerity analysis — preview" icon="👁‍🗨">
          <p className="text-slate-300 text-sm">
            This short preview is based on the listing details only. Unlock the full
            CarVerity report to see tailored inspection tips, negotiation angles,
            and ownership guidance for this exact vehicle.
          </p>

          {/* Blurred teaser */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4">
            <div className="backdrop-blur-[3px] opacity-70 select-none text-sm text-slate-400 whitespace-pre-line line-clamp-4">
              {previewSummary || reportText.slice(0, 260) + "…"}
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Full report content locked — upgrade to continue
            </div>
          </div>

          {/* What you unlock */}
          <ul className="mt-3 text-xs text-slate-300 space-y-1">
            <li>• What to double-check in person for THIS car</li>
            <li>• Negotiation ideas based on the seller’s wording</li>
            <li>• Ownership tips tailored to age & kilometres</li>
            <li>• Context to help you feel confident before inspecting</li>
          </ul>

          {/* CTA */}
          <button
            onClick={unlockForTesting}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40"
          >
            Unlock full report (testing)
          </button>

          <p className="text-xs text-slate-500 mt-2">
            In the live app, this unlocks after purchasing a scan.  
            Most buyers unlock before contacting the seller.
          </p>
        </SectionCard>
      )}

      {/* ===== Full report when unlocked ===== */}
      {showUnlocked && (
        <SectionCard id="report" title="Full CarVerity report" icon="✨">
          <div className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap">
            {reportText}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
