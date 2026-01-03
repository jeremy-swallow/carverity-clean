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

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 shadow-[0_0_18px_rgba(0,0,0,0.25)] backdrop-blur-sm px-5 py-5 md:px-7 md:py-6 space-y-3">
      <h2 className="flex items-center gap-2 text-sm tracking-wide font-semibold text-slate-200">
        {icon && <span className="text-base">{icon}</span>}
        {title.toUpperCase()}
      </h2>
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Pill({ label, tone }: { label: string; tone: "low" | "moderate" | "high" | "na" }) {
  const toneMap: Record<typeof tone, string> = {
    low: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25",
    moderate: "bg-amber-500/15 text-amber-300 border border-amber-400/25",
    high: "bg-rose-500/15 text-rose-300 border border-rose-400/25",
    na: "bg-slate-500/15 text-slate-300 border border-slate-400/25",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${toneMap[tone]}`}>
      {label}
    </span>
  );
}

/* =========================================================
   Main Component
========================================================= */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setResult(stored);
  }, []);

  function unlockForTesting() {
    if (!result) return;
    const updated: SavedResult = {
      ...result,
      isUnlocked: true,
    };
    saveOnlineResults(updated);
    localStorage.setItem(UNLOCK_KEY, "1");
    setResult(updated);
  }

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-semibold mb-2">No scan data found</h1>
        <p className="text-slate-400">Run a scan to view your CarVerity results.</p>
      </div>
    );
  }

  const {
    vehicle = {},
    confidenceCode,
    previewSummary,
    fullSummary,
    summary,
    isUnlocked,
  } = result;

  const confidenceTone =
    confidenceCode === "LOW"
      ? "low"
      : confidenceCode === "MODERATE"
      ? "moderate"
      : confidenceCode === "HIGH"
      ? "high"
      : "na";

  const confidenceLabel = confidenceCode
    ? `${confidenceCode} — listing confidence`
    : "Not available";

  const reportText = isUnlocked ? fullSummary || summary || "" : "";
  const hasStoredUnlock = localStorage.getItem(UNLOCK_KEY) === "1";

  const showUnlocked = isUnlocked || hasStoredUnlock;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-700/80 to-indigo-600/80 border border-white/10 shadow-lg px-6 py-6">
        <h1 className="text-lg font-semibold text-white mb-1">
          CarVerity online scan results
        </h1>
        <p className="text-slate-200/90 text-sm">
          Independent guidance based on the details in this listing.
        </p>
      </div>

      {/* Confidence */}
      <SectionCard title="Listing confidence" icon="🧭">
        <Pill label={confidenceLabel} tone={confidenceTone as any} />
      </SectionCard>

      {/* Preview / Locked Card */}
      {!showUnlocked && (
        <SectionCard title="CarVerity analysis — preview" icon="🔒">
          <p className="text-slate-300">
            {previewSummary ||
              "This scan highlights the key things worth checking when you see the car in person. Unlock the full report to see the detailed guidance, inspection checklist, and negotiation suggestions tailored to this listing."}
          </p>

          <div className="mt-3 rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3 text-sm text-slate-400 select-none">
            Full report content is locked
          </div>

          <button
            onClick={unlockForTesting}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 transition px-4 py-2 text-sm font-medium text-white shadow"
          >
            Unlock full scan (testing)
          </button>

          <p className="text-xs text-slate-500 mt-2">
            In the live app this area unlocks after purchasing a scan.
          </p>
        </SectionCard>
      )}

      {/* Unlocked Full Scan */}
      {showUnlocked && (
        <SectionCard title="Full CarVerity report" icon="✨">
          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
            {reportText}
          </div>

          {!isUnlocked && (
            <p className="text-xs text-slate-500">
              (Unlocked in testing mode — mirrors paid unlock behaviour)
            </p>
          )}
        </SectionCard>
      )}

      {/* Vehicle Details */}
      <SectionCard title="Vehicle details" icon="🚗">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 text-sm">
          <div>
            <div className="text-slate-400">Make</div>
            <div className="font-medium">{vehicle.make || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400">Model</div>
            <div className="font-medium">{vehicle.model || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400">Year</div>
            <div className="font-medium">{vehicle.year || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400">Kilometres</div>
            <div className="font-medium">{vehicle.kilometres || "—"}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
