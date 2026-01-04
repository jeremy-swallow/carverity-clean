// src/pages/OnlineResults.tsx
import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_full_unlock";

/* --------------------------------------------------------
   Shared UI building blocks
-------------------------------------------------------- */

function SectionShell({
  title,
  icon,
  id,
  children,
}: {
  title: string;
  icon: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-[0_20px_45px_rgba(0,0,0,0.45)] scroll-mt-28 overflow-hidden animate-[fadeIn_0.45s_ease-out]"
    >
      <div className="px-6 py-3 border-b border-white/10 bg-gradient-to-r from-slate-800/70 to-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="text-sm font-semibold tracking-wide text-slate-100">
            {title.toUpperCase()}
          </h2>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">{children}</div>
    </section>
  );
}

function GradientCard({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className={`
        rounded-2xl border border-white/10
        bg-gradient-to-b ${accent}
        shadow-[0_12px_35px_rgba(0,0,0,0.45)]
      `}
    >
      <div className="rounded-xl bg-slate-950/35 border border-white/5 px-4 py-3 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function ConfidencePill({
  tone,
  label,
}: {
  tone: "low" | "moderate" | "high" | "na";
  label: string;
}) {
  const map: Record<typeof tone, string> = {
    low: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
    moderate: "bg-amber-500/15 text-amber-300 border-amber-400/25",
    high: "bg-rose-500/15 text-rose-300 border-rose-400/25",
    na: "bg-slate-500/15 text-slate-300 border-slate-400/25",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[tone]}`}
    >
      {label}
    </span>
  );
}

/* --------------------------------------------------------
   Visual section themes
-------------------------------------------------------- */

const THEMES: Record<
  string,
  { icon: string; accent: string }
> = {
  confidence: { icon: "🧭", accent: "from-indigo-600/30 to-indigo-500/10" },
  risks: { icon: "⚠️", accent: "from-amber-600/30 to-amber-400/10" },
  buyer: { icon: "🔍", accent: "from-blue-600/30 to-blue-400/10" },
  negotiation: { icon: "🤝", accent: "from-teal-600/30 to-teal-400/10" },
  ownership: { icon: "🧰", accent: "from-slate-600/30 to-slate-500/10" },
  summary: { icon: "✨", accent: "from-violet-600/30 to-fuchsia-400/10" },
};

/* --------------------------------------------------------
   Report parsing helpers
-------------------------------------------------------- */

type ReportSection = { title: string; body: string };

function parseSections(text: string): ReportSection[] {
  if (!text?.trim()) return [];
  const out: ReportSection[] = [];
  const regex = /(^|\n)###\s+([^\n]+)\n([\s\S]*?)(?=\n###\s+|$)/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text))) {
    out.push({ title: m[2].trim(), body: m[3].trim() });
  }

  if (!out.length) out.push({ title: "Overview", body: text.trim() });
  return out;
}

/* --------------------------------------------------------
   Main component
-------------------------------------------------------- */

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (stored) setResult(stored);
  }, []);

  function unlockForTesting() {
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
        <p className="text-slate-400">
          Run a scan to view your CarVerity results.
        </p>
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
    conditionSummary,
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

  const report = fullSummary || summary || "";
  const showUnlocked =
    (isUnlocked ?? false) || localStorage.getItem(UNLOCK_KEY) === "1";
  const sections = parseSections(report);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Sticky top vehicle bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-slate-950/70 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-300">
          <div className="truncate">
            {vehicle.year || "—"} {vehicle.make || "Vehicle"}{" "}
            {vehicle.model || ""}
          </div>
          <div>{vehicle.kilometres ? `${vehicle.kilometres} km` : "— km"}</div>
        </div>
      </div>

      {/* Confidence */}
      <SectionShell id="confidence" icon="🧭" title="Listing confidence">
        <ConfidencePill tone={confidenceTone as any} label={confidenceLabel} />

        {conditionSummary && (
          <div className="mt-2 px-3 py-2 inline-block rounded-xl bg-white/10 border border-white/15 text-[11px] text-slate-100">
            {conditionSummary}
          </div>
        )}
      </SectionShell>

      {/* Preview teaser (locked) */}
      {!showUnlocked && (
        <SectionShell id="preview" icon="👁‍🗨" title="CarVerity analysis — preview">
          <p className="text-slate-300 text-sm leading-relaxed">
            {previewSummary ||
              "This short preview is based on the listing details only. Unlock the full CarVerity report to see tailored inspection tips, negotiation angles, and ownership guidance for this exact vehicle."}
          </p>

          <div className="rounded-xl border border-white/10 bg-slate-800/40 text-slate-400 px-4 py-3 text-sm select-none">
            Full report content is locked — upgrade to continue
          </div>

          <ul className="text-slate-200 text-sm space-y-1 mt-2 ml-1">
            <li>• What to double-check in person for THIS car</li>
            <li>• Negotiation ideas based on the seller’s wording</li>
            <li>• Ownership tips tailored to age & kilometres</li>
            <li>• Context to help you feel confident before inspecting</li>
          </ul>

          <button
            onClick={unlockForTesting}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow"
          >
            Unlock full report (testing)
          </button>

          <p className="text-xs text-slate-500 mt-2">
            In the live app, this unlocks after purchasing a scan.
          </p>
        </SectionShell>
      )}

      {/* Full Report (premium layout) */}
      {showUnlocked && (
        <SectionShell id="report" icon="✨" title="Full CarVerity report">
          <div className="space-y-6">
            {sections.map((s, i) => {
              const lower = s.title.toLowerCase();
              const theme =
                lower.includes("risk")
                  ? THEMES.risks
                  : lower.includes("buyer")
                  ? THEMES.buyer
                  : lower.includes("negotiation")
                  ? THEMES.negotiation
                  : lower.includes("ownership")
                  ? THEMES.ownership
                  : lower.includes("confidence")
                  ? THEMES.confidence
                  : THEMES.summary;

              return (
                <div
                  key={i}
                  className="opacity-0 translate-y-2 animate-[fadeUp_0.45s_ease-out_forwards]"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mb-2 flex items-center gap-2 text-slate-200 text-sm font-semibold">
                    <span>{theme.icon}</span>
                    <span>{s.title}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-slate-400">
                      Section {i + 1}
                    </span>
                  </div>

                  <GradientCard accent={theme.accent}>{s.body}</GradientCard>
                </div>
              );
            })}
          </div>
        </SectionShell>
      )}

      {/* Vehicle details */}
      <SectionShell id="vehicle" icon="🚗" title="Vehicle details">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 text-sm">
          <div>
            <div className="text-slate-400 text-xs">Make</div>
            <div className="font-medium text-slate-100">
              {vehicle.make || "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Model</div>
            <div className="font-medium text-slate-100">
              {vehicle.model || "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Year</div>
            <div className="font-medium text-slate-100">
              {vehicle.year || "—"}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-xs">Kilometres</div>
            <div className="font-medium text-slate-100">
              {vehicle.kilometres || "—"}
            </div>
          </div>
        </div>
      </SectionShell>

      {/* Animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
      `}</style>
    </div>
  );
}
