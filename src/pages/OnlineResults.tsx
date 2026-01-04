import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_full_unlock";

/* =========================================================
   Reusable UI Blocks
========================================================= */

function SectionShell({
  title,
  icon,
  section,
  children,
  gradient,
}: {
  title: string;
  icon: string;
  section: number;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`
        rounded-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.35)]
        bg-gradient-to-b ${gradient}
        animate-[fadeUp_0.45s_ease-out_forwards] opacity-0 translate-y-2
      `}
    >
      <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold tracking-wide">
            {title.toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-slate-300">
          Section {section}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfidenceGauge({ code }: { code?: string }) {
  let pct = code === "LOW" ? 33 : code === "MODERATE" ? 66 : code === "HIGH" ? 100 : 0;
  const gradient =
    pct === 0
      ? "conic-gradient(#1e293b 0deg,#1e293b 360deg)"
      : `conic-gradient(#a855f7 ${pct * 3.6}deg,#1e293b ${pct * 3.6}deg 360deg)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full border border-white/10 shadow-inner flex items-center justify-center"
        style={{ backgroundImage: gradient }}
      >
        <div className="w-7 h-7 rounded-full bg-slate-950/90 flex items-center justify-center text-[10px] font-semibold">
          {code ?? "N/A"}
        </div>
      </div>

      <div className="text-xs text-slate-200">
        <div className="font-semibold">Confidence</div>
        <div className="text-slate-300">
          {code === "LOW" && "Comfortable so far"}
          {code === "MODERATE" && "Mostly positive"}
          {code === "HIGH" && "Proceed carefully"}
          {!code && "Not available"}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Report Parsing
========================================================= */

type ReportSection = { title: string; body: string };

function parseSections(text: string): ReportSection[] {
  const out: ReportSection[] = [];
  if (!text?.trim()) return out;

  const re = /(^|\n)###\s+([^\n]+)\n([\s\S]*?)(?=\n###\s+|$)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    out.push({
      title: m[2].trim(),
      body: m[3].trim(),
    });
  }

  if (!out.length) out.push({ title: "Overview", body: text.trim() });
  return out;
}

function themeFor(title: string) {
  const t = title.toLowerCase();

  if (t.includes("confidence"))
    return { icon: "🧭", gradient: "from-indigo-600/35 to-indigo-500/15" };
  if (t.includes("means"))
    return { icon: "✨", gradient: "from-violet-600/35 to-fuchsia-500/15" };
  if (t.includes("risk"))
    return { icon: "⚠️", gradient: "from-amber-600/35 to-amber-500/15" };
  if (t.includes("buyer"))
    return { icon: "🛠️", gradient: "from-blue-600/35 to-blue-500/15" };
  if (t.includes("negotiation"))
    return { icon: "🤝", gradient: "from-teal-600/35 to-teal-500/15" };
  if (t.includes("ownership"))
    return { icon: "🚗", gradient: "from-emerald-600/35 to-emerald-500/15" };

  return { icon: "📌", gradient: "from-slate-600/35 to-slate-500/15" };
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

  function unlock() {
    if (!result) return;
    const updated = { ...result, isUnlocked: true };
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

  const report = fullSummary || summary || "";
  const unlocked =
    (isUnlocked ?? false) || localStorage.getItem(UNLOCK_KEY) === "1";

  const sections = parseSections(report);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

      {/* Sticky top bar */}
      <div className="sticky top-0 -mx-4 px-4 py-2 bg-slate-950/70 backdrop-blur border-b border-white/5 z-30">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>
            {vehicle.year || "—"} {vehicle.make || "Vehicle"} {vehicle.model || ""}
          </span>
          <span>{vehicle.kilometres ? `${vehicle.kilometres} km` : "— km"}</span>
        </div>
      </div>

      {/* Premium Header */}
      <section className="rounded-2xl bg-gradient-to-r from-violet-700/80 to-indigo-600/80 border border-white/10 shadow-xl px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white">
              CarVerity online scan results
            </h1>
            <p className="text-slate-100/90 text-sm">
              Independent guidance based on the details in this listing.
            </p>
          </div>

          <div className="hidden md:flex">
            <ConfidenceGauge code={confidenceCode} />
          </div>
        </div>
      </section>

      {/* Locked Preview */}
      {!unlocked && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-5">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            👁️ CARVERITY ANALYSIS — PREVIEW
          </h2>

          <p className="text-slate-300 text-sm mt-2">
            {previewSummary ||
              "This short preview is based on the listing only. Unlock the full CarVerity report to see tailored inspection tips, negotiation ideas, and ownership guidance for this vehicle."}
          </p>

          <div className="mt-3 rounded-xl border border-white/10 bg-slate-800/40 px-4 py-3 text-sm text-slate-400">
            Full report content is locked
          </div>

          <button
            onClick={unlock}
            className="mt-3 inline-flex px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium shadow"
          >
            Unlock full scan (testing)
          </button>

          <p className="text-xs text-slate-500 mt-2">
            In the live app this unlocks after purchasing a scan.
          </p>
        </div>
      )}

      {/* Full Report */}
      {unlocked && (
        <section className="space-y-6">
          {sections.map((s, i) => {
            const theme = themeFor(s.title);
            return (
              <SectionShell
                key={i}
                title={s.title}
                icon={theme.icon}
                section={i + 1}
                gradient={theme.gradient}
              >
                {s.body}
              </SectionShell>
            );
          })}
        </section>
      )}

      {/* Vehicle details */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
          🚗 VEHICLE DETAILS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 mt-3 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Make</div>
            <div className="text-slate-100 font-medium">{vehicle.make || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Model</div>
            <div className="text-slate-100 font-medium">{vehicle.model || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Year</div>
            <div className="text-slate-100 font-medium">{vehicle.year || "—"}</div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Kilometres</div>
            <div className="text-slate-100 font-medium">
              {vehicle.kilometres || "—"}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
