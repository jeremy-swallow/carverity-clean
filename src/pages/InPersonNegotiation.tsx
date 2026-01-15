// src/pages/InPersonNegotiation.tsx

import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Handshake,
  TrendingDown,
  ShieldCheck,
  Scale,
  ArrowLeft,
  Info,
  Sparkles,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import {
  analyseInPersonInspection,
  type AnalysisResult,
  type NegotiationBand,
} from "../utils/inPersonAnalysis";

/* =========================================================
   Small helpers
========================================================= */

type StanceKey = "conservative" | "balanced" | "aggressive";

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatAud(n: number) {
  const safe = clampNumber(Math.round(n), 0, 99999999);
  return safe.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 whitespace-pre-line">
      {children}
    </p>
  );
}

function Pill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function bandTitle(stance: StanceKey) {
  if (stance === "conservative") return "Conservative (low friction)";
  if (stance === "aggressive") return "Assertive (walk-away ready)";
  return "Balanced (recommended)";
}

function stanceTone(stance: StanceKey) {
  if (stance === "conservative") {
    return {
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      accent: "text-emerald-300",
      button: "bg-emerald-500 hover:bg-emerald-400 text-black",
    };
  }
  if (stance === "aggressive") {
    return {
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      accent: "text-amber-200",
      button: "bg-amber-400 hover:bg-amber-300 text-black",
    };
  }
  return {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    accent: "text-indigo-200",
    button: "bg-indigo-500 hover:bg-indigo-400 text-black",
  };
}

function buildTalkingPoints(
  analysis: AnalysisResult,
  stance: StanceKey
): string[] {
  const points: string[] = [];

  const critical = analysis.risks.filter((r) => r.severity === "critical");
  const moderate = analysis.risks.filter((r) => r.severity === "moderate");

  // Keep this short and premium. No “scripts”, no cringe.
  if (critical.length > 0) {
    points.push(
      `There ${
        critical.length === 1 ? "is" : "are"
      } ${critical.length} high-impact item${
        critical.length === 1 ? "" : "s"
      } recorded — I need clarity and price adjustment to proceed.`
    );
  } else if (moderate.length > 0) {
    points.push(
      `A few items stood out in the inspection — I’m comfortable proceeding, but only if the price reflects them.`
    );
  } else {
    points.push(
      `Overall the inspection looked acceptable — I’m still looking for a fair deal based on the evidence captured.`
    );
  }

  // Evidence / confidence framing
  if (analysis.completenessScore < 55) {
    points.push(
      "Evidence coverage is limited — I’m factoring that uncertainty into the price."
    );
  } else if (analysis.completenessScore < 75) {
    points.push(
      "Coverage was moderate — I’m pricing in the remaining uncertainty."
    );
  } else {
    points.push(
      "Coverage was strong — I’m negotiating from what was actually observed."
    );
  }

  // Stance-specific tone
  if (stance === "conservative") {
    points.push(
      "If you can address the key items with clear answers or receipts, I’m happy to move quickly today."
    );
  } else if (stance === "aggressive") {
    points.push(
      "If we can’t get comfortable on the recorded concerns, I’ll keep looking — I don’t want to take on unknown risk."
    );
  } else {
    points.push(
      "If we meet in the middle based on the recorded findings, I’m ready to proceed."
    );
  }

  // Add 2–3 “specific” items max to keep it premium
  const top = [...critical, ...moderate].slice(0, 3);
  for (const r of top) {
    points.push(`${r.label}: ${r.explanation}`);
  }

  return points;
}

export default function InPersonNegotiation() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const [stance, setStance] = useState<StanceKey>("balanced");

  const analysis: AnalysisResult = useMemo(() => {
    return analyseInPersonInspection((progress ?? {}) as any);
  }, [progress]);

  const askingPrice = useMemo(() => {
    // Try common fields you may already store
    const candidates = [
      progress?.askingPrice,
      progress?.price,
      progress?.vehiclePrice,
      progress?.listingPrice,
    ];
    for (const c of candidates) {
      const n = asNumber(c);
      if (n != null) return n;
    }
    return null;
  }, [progress]);

  const band: NegotiationBand =
    analysis.negotiationPositioning?.[stance] ??
    analysis.negotiationPositioning?.balanced;

  const tone = stanceTone(stance);

  const talkingPoints = useMemo(() => {
    return buildTalkingPoints(analysis, stance);
  }, [analysis, stance]);

  const quickSummary = useMemo(() => {
    const critical = analysis.risks.filter((r) => r.severity === "critical")
      .length;
    const moderate = analysis.risks.filter((r) => r.severity === "moderate")
      .length;

    if (critical > 0) {
      return `High-impact items recorded: ${critical}. Use a firmer position unless resolved.`;
    }
    if (moderate > 0) {
      return `Meaningful items recorded: ${moderate}. Negotiate calmly with evidence.`;
    }
    return "No major concerns were recorded. Negotiate for fairness, not conflict.";
  }, [analysis]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              CarVerity · Buyer-safe negotiation
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Negotiate with evidence — not vibes
            </h1>
          </div>

          <button
            onClick={() => navigate("/scan/in-person/results")}
            className="hidden sm:flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/50 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </button>
        </div>

        <Paragraph>
          These are <span className="text-slate-200 font-medium">talking points</span>{" "}
          (not scripts). Use only what feels appropriate.
        </Paragraph>
      </header>

      {/* Top metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Pill
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Confidence"
          value={`${analysis.confidenceScore}%`}
        />
        <Pill
          icon={<Scale className="h-4 w-4" />}
          label="Coverage"
          value={`${analysis.completenessScore}%`}
        />
        <Pill
          icon={<TrendingDown className="h-4 w-4" />}
          label="Asking price"
          value={askingPrice != null ? formatAud(askingPrice) : "Not provided"}
        />
      </section>

      {/* Stance selector */}
      <section
        className={[
          "rounded-2xl border px-5 py-5 space-y-4",
          tone.border,
          tone.bg,
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <Handshake className={`h-5 w-5 ${tone.accent}`} />
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-white">
              Choose your stance
            </h2>
            <p className="text-sm text-slate-300">{quickSummary}</p>
          </div>
        </div>

        {/* Segmented buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setStance("conservative")}
            className={[
              "rounded-xl px-3 py-3 text-xs border transition",
              stance === "conservative"
                ? "bg-emerald-500 text-black border-emerald-400"
                : "border-white/15 bg-slate-950/40 text-slate-200 hover:bg-slate-900/60",
            ].join(" ")}
          >
            Conservative
          </button>

          <button
            type="button"
            onClick={() => setStance("balanced")}
            className={[
              "rounded-xl px-3 py-3 text-xs border transition",
              stance === "balanced"
                ? "bg-indigo-500 text-black border-indigo-400"
                : "border-white/15 bg-slate-950/40 text-slate-200 hover:bg-slate-900/60",
            ].join(" ")}
          >
            Balanced
          </button>

          <button
            type="button"
            onClick={() => setStance("aggressive")}
            className={[
              "rounded-xl px-3 py-3 text-xs border transition",
              stance === "aggressive"
                ? "bg-amber-400 text-black border-amber-300"
                : "border-white/15 bg-slate-950/40 text-slate-200 hover:bg-slate-900/60",
            ].join(" ")}
          >
            Assertive
          </button>
        </div>
      </section>

      {/* Range card */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Suggested adjustment range
            </p>
            <h3 className="text-lg font-semibold text-white">
              {bandTitle(stance)}
            </h3>
          </div>

          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Range (AUD)
            </p>
            <p className="text-2xl font-semibold text-white">
              {formatAud(band.audLow)} – {formatAud(band.audHigh)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              {band.rationale}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          This is not a valuation or a repair quote. It’s a buyer-safe range
          based only on what you recorded.
        </p>
      </section>

      {/* Talking points */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-slate-200">
          <Sparkles className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Best talking points to use</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-5 space-y-3">
          <ul className="space-y-2 text-[15px] text-slate-300">
            {talkingPoints.map((p, i) => (
              <li key={i} className="leading-relaxed">
                • {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mobile back button */}
      <button
        onClick={() => navigate("/scan/in-person/results")}
        className="sm:hidden w-full rounded-xl border border-white/20 bg-slate-900/40 hover:bg-slate-900 px-4 py-3 text-slate-200 font-semibold"
      >
        Back to results
      </button>
    </div>
  );
}
