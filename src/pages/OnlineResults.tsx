import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadOnlineResults,
  saveOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

const UNLOCK_KEY = "carverity_test_full_unlock";

/* =========================================================
   Types & constants
========================================================= */

type ReportSection = {
  title: string;
  body: string;
};

const SECTION_MARKERS = [
  { key: "CONFIDENCE ASSESSMENT", label: "Confidence assessment" },
  { key: "CONFIDENCE_CODE", label: "Confidence code" },
  { key: "WHAT THIS MEANS FOR YOU", label: "What this means for you" },
  { key: "CARVERITY ANALYSIS — SUMMARY", label: "CarVerity analysis — summary" },
  { key: "CARVERITY ANALYSIS - SUMMARY", label: "CarVerity analysis — summary" },
  { key: "KEY RISK SIGNALS", label: "Key risk signals" },
  { key: "BUYER CONSIDERATIONS", label: "Buyer considerations" },
  { key: "NEGOTIATION INSIGHTS", label: "Negotiation insights" },
  { key: "GENERAL OWNERSHIP NOTES", label: "General ownership notes" },
];

/* =========================================================
   Text normalisation & section builder
========================================================= */

function sanitiseReportText(text: string): string {
  if (!text) return "";

  const filteredLines = text
    .split("\n")
    .filter((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("service history date anomaly")) return false;
      if (lower.includes("appears in the future")) return false;
      if (lower.includes("future-dated") || lower.includes("future dated"))
        return false;
      return true;
    });

  return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function buildSectionsFromFreeText(text: string): ReportSection[] {
  const cleaned = sanitiseReportText(text);
  if (!cleaned.trim()) return [];

  const lower = cleaned.toLowerCase();

  const markers = SECTION_MARKERS
    .map((m) => {
      const idx = lower.indexOf(m.key.toLowerCase());
      if (idx === -1) return null;
      return { ...m, idx };
    })
    .filter((m): m is { key: string; label: string; idx: number } => !!m)
    .sort((a, b) => a.idx - b.idx);

  if (!markers.length) {
    return [{ title: "Overview", body: cleaned.trim() }];
  }

  const sections: ReportSection[] = [];

  const first = markers[0];
  if (first.idx > 0) {
    const intro = cleaned.slice(0, first.idx).trim();
    if (intro) sections.push({ title: "Overview", body: intro });
  }

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const start = marker.idx;
    const end = i + 1 < markers.length ? markers[i + 1].idx : cleaned.length;

    let body = cleaned.slice(start, end).trim();
    const headingRegex = new RegExp(marker.key + ":?", "i");
    body = body.replace(headingRegex, "").trim();

    sections.push({ title: marker.label, body });
  }

  return sections;
}

/* =========================================================
   Section theming
========================================================= */

type SectionTheme = {
  icon: string;
  headerGradient: string;
  cardGradient: string;
};

function getSectionTheme(title: string): SectionTheme {
  const t = title.toLowerCase();

  if (t.includes("confidence"))
    return {
      icon: "🧭",
      headerGradient: "from-indigo-500 to-indigo-400",
      cardGradient: "from-indigo-950 to-slate-900",
    };
  if (t.includes("what this means"))
    return {
      icon: "✨",
      headerGradient: "from-violet-500 to-fuchsia-500",
      cardGradient: "from-violet-950 to-slate-900",
    };
  if (t.includes("risk"))
    return {
      icon: "⚠️",
      headerGradient: "from-amber-500 to-orange-500",
      cardGradient: "from-amber-950 to-slate-900",
    };
  if (t.includes("buyer"))
    return {
      icon: "🛠️",
      headerGradient: "from-blue-500 to-sky-500",
      cardGradient: "from-sky-950 to-slate-900",
    };
  if (t.includes("negotiation"))
    return {
      icon: "🤝",
      headerGradient: "from-teal-500 to-emerald-500",
      cardGradient: "from-teal-950 to-slate-900",
    };
  if (t.includes("ownership"))
    return {
      icon: "🚗",
      headerGradient: "from-emerald-500 to-lime-500",
      cardGradient: "from-emerald-950 to-slate-900",
    };
  if (t.includes("analysis"))
    return {
      icon: "📊",
      headerGradient: "from-violet-500 to-indigo-500",
      cardGradient: "from-violet-950 to-slate-900",
    };

  return {
    icon: "📌",
    headerGradient: "from-slate-500 to-slate-400",
    cardGradient: "from-slate-950 to-slate-900",
  };
}

/* =========================================================
   UI bits
========================================================= */

function ConfidenceGauge({ code }: { code?: string }) {
  let value = 0;
  if (code === "LOW") value = 0.33;
  if (code === "MODERATE") value = 0.66;
  if (code === "HIGH") value = 1;

  const pct = Math.round(value * 100);
  const gradient =
    value === 0
      ? "conic-gradient(#1e293b 0deg,#1e293b 360deg)"
      : `conic-gradient(#a855f7 ${pct * 3.6}deg,#1e293b ${
          pct * 3.6
        }deg 360deg)`;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full border border-white/10 shadow-inner flex items-center justify-center"
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

function FullReportSection({
  section,
  index,
}: {
  section: ReportSection;
  index: number;
}) {
  const theme = getSectionTheme(section.title);
  const delayMs = 80 * index;

  return (
    <div
      className={`
        rounded-2xl border border-white/12 shadow-[0_18px_40px_rgba(0,0,0,0.55)]
        bg-gradient-to-b ${theme.cardGradient}
        opacity-0 translate-y-2 animate-[fadeUp_0.45s_ease-out_forwards]
        overflow-hidden
      `}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className={`
          px-5 py-3 border-b border-white/15
          bg-gradient-to-r ${theme.headerGradient}
          flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-2 text-slate-50">
          <span className="text-base">{theme.icon}</span>
          <h3 className="text-sm font-semibold tracking-wide uppercase">
            {section.title}
          </h3>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-slate-100/80">
          Section {index + 1}
        </span>
      </div>

      <div className="px-5 py-4">
        <div className="rounded-xl bg-slate-950/60 border border-white/8 px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
          {section.body}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Main component
========================================================= */

export default function OnlineResults() {
  const navigate = useNavigate();
  const [result, setResult] = useState<SavedResult | null>(null);

  // Track scroll position for floating CTA
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrolled = window.scrollY > 520;
      setShowFloatingBar(scrolled);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Reset unlock when arriving fresh
  useEffect(() => {
    if (!result) return;
    if (!result.isUnlocked) {
      localStorage.removeItem(UNLOCK_KEY);
    }
  }, [result]);

  function goStartNewScan() {
    localStorage.removeItem(UNLOCK_KEY);
    navigate("/start-scan");
  }

  function goMyScans() {
    navigate("/my-scans");
  }

  function goInPersonFlow() {
    navigate("/inperson-start");
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
    createdAt,
  } = result;

  const rawReport = fullSummary || summary || "";
  const sections = buildSectionsFromFreeText(rawReport);

  const storedUnlock = localStorage.getItem(UNLOCK_KEY) === "1";
  const showUnlocked = Boolean(isUnlocked) || storedUnlock;

  const createdLabel = createdAt
    ? new Date(createdAt).toLocaleString()
    : "Saved locally";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Sticky vehicle bar */}
      <div className="sticky top-0 -mx-4 px-4 py-2 bg-slate-950/80 backdrop-blur border-b border-white/5 z-30">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-300">
          <span className="truncate">
            {vehicle.year || "—"} {vehicle.make || "Vehicle"}{" "}
            {vehicle.model || ""}
          </span>
          <span>
            {vehicle.kilometres ? `${vehicle.kilometres} km` : "— km"}
          </span>
        </div>
      </div>

      {/* Scan overview strip */}
      <section className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-slate-200">
          <div className="flex items-center gap-2">
            <span>📡</span>
            <span className="font-semibold">Online listing scan</span>
            <span className="opacity-60">•</span>
            <span>{showUnlocked ? "Full report" : "Preview mode"}</span>
          </div>
          <div className="opacity-80">
            Saved on this device — {createdLabel}
          </div>
        </div>
      </section>

      {/* Premium header */}
      <section className="rounded-2xl bg-gradient-to-r from-violet-700/85 to-indigo-600/85 border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.7)] px-6 py-5 md:py-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white mb-1">
              CarVerity online scan results
            </h1>
            <p className="text-xs md:text-sm text-slate-100/90">
              Independent guidance based on the details in this listing.
            </p>
          </div>

          <ConfidenceGauge code={confidenceCode} />
        </div>
      </section>

      {/* Preview / teaser */}
      {!showUnlocked && (
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_18px_40px_rgba(0,0,0,0.55)] px-5 py-5 space-y-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
            👁️ CARVERITY ANALYSIS — PREVIEW
          </h2>

          <p className="text-sm text-slate-300">
            {previewSummary ||
              "This short preview is based on the listing details only. Unlock the full CarVerity report to see tailored inspection tips, negotiation angles, and ownership guidance for THIS car."}
          </p>

          <div className="mt-1 rounded-xl border border-white/12 bg-slate-800/60 px-4 py-3 text-sm text-slate-400">
            Full report content locked — upgrade to continue
          </div>

          <ul className="mt-2 text-xs text-slate-300 space-y-1 list-disc list-inside">
            <li>What to double-check in person for this car</li>
            <li>Negotiation ideas based on the seller’s wording</li>
            <li>Ownership tips tailored to age & kilometres</li>
            <li>Context to help you feel confident before inspecting</li>
          </ul>

          <button
            onClick={unlockForTesting}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow"
          >
            Unlock full report (testing)
          </button>

          <p className="text-[11px] text-slate-500">
            In the live app, this unlocks after purchasing a scan.
          </p>
        </section>
      )}

      {/* FULL REPORT */}
      {showUnlocked && (
        <section className="rounded-2xl border border-white/12 bg-slate-950/85 shadow-[0_28px_70px_rgba(0,0,0,0.75)] px-5 py-5 space-y-5">
          <header className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-100">
              <span className="text-base">✨</span>
              <h2 className="text-sm md:text-base font-semibold tracking-wide uppercase">
                Full CarVerity report
              </h2>
            </div>
            <span className="text-[11px] text-emerald-300/90 border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Unlocked for testing
            </span>
          </header>

          <div className="space-y-5">
            {sections.map((section, idx) => (
              <FullReportSection key={idx} section={section} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Vehicle details */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-5">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
          🚗 VEHICLE DETAILS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 mt-3 text-sm">
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
      </section>

      {/* ACTION FOOTER (desktop & fallback) */}
      <section className="hidden md:block rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-5 space-y-3">
        <button
          onClick={goInPersonFlow}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 shadow"
        >
          Continue — in-person inspection
        </button>

        <button
          onClick={goStartNewScan}
          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 shadow"
        >
          Start another online scan
        </button>

        <button
          onClick={goMyScans}
          className="w-full rounded-xl border border-white/20 text-slate-200 px-4 py-2"
        >
          View my scans
        </button>
      </section>

      {/* FLOATING ACTION BAR — mobile only */}
      {showFloatingBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="mx-3 mb-3 rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur shadow-[0_20px_60px_rgba(0,0,0,0.7)] px-4 py-3 space-y-2">
            <button
              onClick={goInPersonFlow}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-4 py-2 shadow"
            >
              Continue — in-person inspection
            </button>

            <div className="flex gap-2">
              <button
                onClick={goStartNewScan}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 text-sm shadow"
              >
                New scan
              </button>

              <button
                onClick={goMyScans}
                className="flex-1 rounded-xl border border-white/25 text-slate-200 px-3 py-2 text-sm"
              >
                My scans
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
