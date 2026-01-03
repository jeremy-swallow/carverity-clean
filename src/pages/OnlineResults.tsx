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
  id,
  icon,
  children,
}: {
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
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "low" | "moderate" | "high" | "na";
}) {
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
   Confidence gauge
========================================================= */

function ConfidenceGauge({ code }: { code?: string }) {
  let value = 0;
  if (code === "LOW") value = 0.33;
  if (code === "MODERATE") value = 0.66;
  if (code === "HIGH") value = 1;

  const percentage = Math.round(value * 100);
  const gradient =
    value === 0
      ? "conic-gradient(#1e293b 0deg, #1e293b 360deg)"
      : `conic-gradient(#a855f7 ${percentage * 3.6}deg, #1e293b ${
          percentage * 3.6
        }deg 360deg)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center border border-white/10 shadow-inner"
        style={{ backgroundImage: gradient }}
      >
        <div className="w-7 h-7 rounded-full bg-slate-950/90 flex items-center justify-center text-[10px] font-semibold text-slate-100">
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
   Sticky mini navigation
========================================================= */

function MiniNav() {
  const items = [
    { id: "overview", label: "Overview" },
    { id: "confidence", label: "Confidence" },
    { id: "analysis", label: "Preview" },
    { id: "report", label: "Full Report" },
    { id: "vehicle", label: "Vehicle" },
  ];

  return (
    <div className="sticky top-2 z-20">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-sm px-3 py-2 flex gap-2 overflow-x-auto">
        {items.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition whitespace-nowrap"
          >
            {i.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Report helpers
========================================================= */

type ReportSection = {
  title: string;
  body: string;
};

function parseReportSections(text: string): ReportSection[] {
  const sections: ReportSection[] = [];
  if (!text || !text.trim()) return sections;

  const headingRegex =
    /(^|\n)###\s+([^\n]+)\n([\s\S]*?)(?=\n###\s+|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(text)) !== null) {
    const title = match[2]?.trim() ?? "Section";
    const body = match[3]?.trim() ?? "";

    if (match.index > lastIndex && sections.length === 0) {
      const intro = text.slice(lastIndex, match.index).trim();
      if (intro) sections.push({ title: "Overview", body: intro });
    }

    sections.push({ title, body });
    lastIndex = headingRegex.lastIndex;
  }

  if (sections.length === 0) {
    const trimmed = text.trim();
    if (trimmed) sections.push({ title: "Overview", body: trimmed });
  }

  return sections;
}

/* =========================================================
   Section-aware visual theming
========================================================= */

type VisualTheme = {
  icon: string;
  accent: string;
  banner: string;
};

function getSectionTheme(title: string): VisualTheme {
  const t = title.toLowerCase();

  if (t.includes("confidence")) {
    return {
      icon: "🧭",
      accent: "from-indigo-500/25 to-indigo-400/10",
      banner: "from-indigo-600/30 to-indigo-500/20",
    };
  }

  if (t.includes("what this means")) {
    return {
      icon: "✨",
      accent: "from-violet-500/25 to-fuchsia-400/10",
      banner: "from-violet-600/30 to-fuchsia-500/20",
    };
  }

  if (t.includes("risk")) {
    return {
      icon: "📝",
      accent: "from-amber-500/25 to-amber-400/10",
      banner: "from-amber-600/30 to-amber-500/20",
    };
  }

  if (t.includes("buyer")) {
    return {
      icon: "🚶",
      accent: "from-blue-500/25 to-blue-400/10",
      banner: "from-blue-600/30 to-blue-500/20",
    };
  }

  if (t.includes("negotiation")) {
    return {
      icon: "🤝",
      accent: "from-teal-500/25 to-teal-400/10",
      banner: "from-teal-600/30 to-teal-500/20",
    };
  }

  if (t.includes("ownership")) {
    return {
      icon: "🧰",
      accent: "from-slate-500/25 to-slate-400/10",
      banner: "from-slate-600/30 to-slate-500/20",
    };
  }

  return {
    icon: "📌",
    accent: "from-slate-500/25 to-slate-400/10",
    banner: "from-slate-600/30 to-slate-500/20",
  };
}

function buildHighlights(opts: {
  confidenceCode?: string;
  vehicle: any;
  conditionSummary?: string;
}): string[] {
  const { confidenceCode, vehicle, conditionSummary } = opts;
  const highlights: string[] = [];

  const title = `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${
    vehicle.model ?? ""
  }`
    .replace(/\s+/g, " ")
    .trim();
  if (title) highlights.push(title);

  if (vehicle.kilometres) highlights.push(`${vehicle.kilometres} km listed`);

  if (confidenceCode === "LOW") {
    highlights.push("Nothing major stands out from the listing");
  } else if (confidenceCode === "MODERATE") {
    highlights.push("Mostly positive with a few details to confirm in person");
  } else if (confidenceCode === "HIGH") {
    highlights.push("Several details are worth checking carefully in person");
  }

  highlights.push(
    conditionSummary ||
      "Includes inspection tips, negotiation ideas & ownership notes"
  );

  return highlights.slice(0, 4);
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
    const updated: SavedResult = { ...result, isUnlocked: true };
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

  const reportText = fullSummary || summary || "";
  const hasStoredUnlock = localStorage.getItem(UNLOCK_KEY) === "1";

  const showUnlocked = (isUnlocked ?? hasStoredUnlock) === true;

  const sections = parseReportSections(reportText);
  const highlightChips = buildHighlights({
    confidenceCode,
    vehicle,
    conditionSummary,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Sticky vehicle bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-slate-950/70 backdrop-blur border-b border-white/5">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <div className="text-slate-300 truncate">
            {vehicle.year || "—"} {vehicle.make || "Vehicle"} {vehicle.model || ""}
          </div>
          <div className="text-slate-400">
            {vehicle.kilometres ? `${vehicle.kilometres} km` : "— km"}
          </div>
        </div>
      </div>

      {/* Header */}
      <section
        id="overview"
        className="rounded-2xl bg-gradient-to-r from-violet-700/80 to-indigo-600/80 border border-white/10 shadow-lg px-6 py-5 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-lg font-semibold text-white mb-1">
            CarVerity online scan results
          </h1>
          <p className="text-slate-100/90 text-xs md:text-sm">
            Independent guidance based on the details in this listing.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {highlightChips.map((chip, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-slate-950/30 text-[11px] text-slate-100 border border-white/15"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConfidenceGauge code={confidenceCode} />
          <span className="hidden md:inline-flex text-[11px] px-3 py-1 rounded-full bg-white/15 text-white border border-white/25">
            Download PDF (coming soon)
          </span>
        </div>
      </section>

      <MiniNav />

      {/* Confidence */}
      <SectionCard id="confidence" title="Listing confidence" icon="🧭">
        <Pill label={confidenceLabel} tone={confidenceTone as any} />
      </SectionCard>

      {/* Preview */}
      {!showUnlocked && (
        <SectionCard id="analysis" title="CarVerity analysis — preview" icon="👁‍🗨">
          <p className="text-slate-300 text-sm">
            {previewSummary ||
              "This short preview is based on the listing details only. The full CarVerity report adds clearer guidance on what to look for in person, specific items to double-check, and helpful negotiation and ownership tips tailored to this vehicle."}
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

      {/* ✨ Full Report — Section-aware visuals + staggered reveal */}
      {showUnlocked && (
        <SectionCard id="report" title="Full CarVerity report" icon="✨">
          <div className="space-y-5">
            {sections.map((section, idx) => {
              const theme = getSectionTheme(section.title);

              // Staggered animation delay per card
              const delayMs = 70 * idx;

              return (
                <div
                  key={idx}
                  style={{ animationDelay: `${delayMs}ms` }}
                  className={`
                    opacity-0 translate-y-2
                    animate-[fadeUp_0.42s_ease-out_forwards]
                    rounded-2xl border border-white/10
                    bg-gradient-to-b ${theme.accent}
                    shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                  `}
                >
                  {/* Banner */}
                  <div
                    className={`px-5 py-3 border-b border-white/10 bg-gradient-to-r ${theme.banner} rounded-t-2xl flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{theme.icon}</span>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {section.title}
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      Section {idx + 1}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="px-5 py-4">
                    <div className="rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed">
                      {section.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!isUnlocked && (
            <p className="text-xs text-slate-500 mt-2">
              (Unlocked in testing mode — mirrors paid unlock behaviour)
            </p>
          )}
        </SectionCard>
      )}

      {/* Vehicle details */}
      <SectionCard id="vehicle" title="Vehicle details" icon="🚗">
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
      </SectionCard>

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
