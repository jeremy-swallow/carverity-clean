// src/pages/InPersonResults.tsx

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

/* =======================================================
   Small rendering helpers (visual-only, type-safe)
======================================================= */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asCleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function Paragraph({
  value,
  tone = "muted",
}: {
  value: unknown;
  tone?: "muted" | "normal" | "strong";
}) {
  const t = asCleanText(value);
  if (!t) return null;

  const cls =
    tone === "strong"
      ? "text-[15px] leading-relaxed text-slate-200 max-w-3xl whitespace-pre-line"
      : tone === "normal"
      ? "text-[15px] leading-relaxed text-slate-300 max-w-3xl whitespace-pre-line"
      : "text-[14px] leading-relaxed text-slate-400 max-w-3xl whitespace-pre-line";

  return <p className={cls}>{t}</p>;
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function pickFirstUsefulText(evidence: unknown): string {
  if (typeof evidence === "string" && evidence.trim()) return evidence.trim();

  if (Array.isArray(evidence)) {
    const strings = evidence.map(asCleanText).filter(Boolean);
    if (strings.length > 0) return strings.join("\n");
  }

  if (isRecord(evidence)) {
    const preferredKeys = [
      "summary",
      "text",
      "notes",
      "bullets",
      "bulletPoints",
      "points",
      "items",
    ];

    for (const key of preferredKeys) {
      const v = evidence[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return strings.join("\n");
      }
    }
  }

  return "";
}

function extractEvidenceBullets(evidence: unknown): string[] {
  if (!evidence) return [];

  // If analysis.evidenceSummary is a string, we can’t safely bullet it.
  if (typeof evidence === "string") return [];

  if (Array.isArray(evidence)) {
    return evidence.map(asCleanText).filter(Boolean);
  }

  if (isRecord(evidence)) {
    const v = evidence["bullets"];
    if (Array.isArray(v)) return v.map(asCleanText).filter(Boolean);

    const fallbackKeys = ["bulletPoints", "points", "items"];
    for (const k of fallbackKeys) {
      const vv = evidence[k];
      if (Array.isArray(vv)) return vv.map(asCleanText).filter(Boolean);
    }
  }

  return [];
}

function UncertaintyText(u: unknown): string {
  if (typeof u === "string") return u;
  if (isRecord(u)) {
    return (
      asCleanText(u.label) ||
      asCleanText(u.title) ||
      asCleanText(u.reason) ||
      asCleanText(u.description) ||
      "An item was marked as unsure by the buyer."
    );
  }
  return "An item was marked as unsure by the buyer.";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

/* =======================================================
   Guided meaning helpers (no extra user steps)
======================================================= */

type SignalTone = "critical" | "moderate" | "unknown";

function severityPillClasses(tone: SignalTone) {
  if (tone === "critical") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  }
  if (tone === "moderate") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/5 text-slate-200";
}

function outcomeOneLiner(verdict: "proceed" | "caution" | "walk-away") {
  if (verdict === "proceed") {
    return "Based on what you recorded, nothing strongly suggests elevated risk. Proceed normally — but still confirm the basics.";
  }
  if (verdict === "caution") {
    return "You recorded a few signals worth clarifying. If the seller can’t explain them with evidence, pausing is reasonable.";
  }
  return "Your recorded signals suggest elevated risk. If key items can’t be verified, walking away is a sensible outcome.";
}

function buyerMeaningFromLabel(labelRaw: string) {
  const label = (labelRaw || "").toLowerCase();

  // Keep this calm + general; don’t diagnose.
  if (label.includes("tyre")) {
    return {
      meaning:
        "Uneven or low tread can signal alignment/suspension wear or neglected maintenance.",
      ask:
        "Ask for recent tyre replacement/alignment history and check if wear is even across all tyres.",
      hint: "If wear is uneven or tyres are due soon, it can justify a price adjustment.",
    };
  }

  if (
    label.includes("brake") ||
    label.includes("disc") ||
    label.includes("rotor")
  ) {
    return {
      meaning:
        "Heavy scoring or worn discs can mean brakes are due sooner than expected.",
      ask: "Ask when brakes were last replaced and whether there’s an invoice.",
      hint: "Brake work can be a near-term cost — useful leverage if evidence is missing.",
    };
  }

  if (label.includes("air") || label.includes("a/c") || label.includes("aircon")) {
    return {
      meaning:
        "Weak or slow cooling often indicates a service need. It may be minor or may require parts.",
      ask:
        "Ask to run the AC for a few minutes and confirm it gets cold quickly at idle and while driving.",
      hint: "If it doesn’t cool properly, treat it as a real cost item.",
    };
  }

  if (
    label.includes("smell") ||
    label.includes("moisture") ||
    label.includes("mould")
  ) {
    return {
      meaning:
        "Musty/damp smells can point to water entry, leaks, or previous flood/wet storage.",
      ask:
        "Ask about water entry/repairs and check footwells/boot for dampness if possible.",
      hint: "Persistent moisture issues can be hard to fix — higher caution if strong.",
    };
  }

  if (
    label.includes("steering") ||
    label.includes("handling") ||
    label.includes("vibration") ||
    label.includes("pull")
  ) {
    return {
      meaning:
        "Pulling/vibration can signal alignment, tyre issues, or suspension wear. It’s worth clarifying.",
      ask:
        "Ask if there’s been any suspension/steering work and whether it’s been aligned recently.",
      hint: "If it pulls or vibrates clearly, treat it as a meaningful risk signal.",
    };
  }

  if (
    label.includes("noise") ||
    label.includes("engine") ||
    label.includes("hesitation") ||
    label.includes("gear") ||
    label.includes("shift")
  ) {
    return {
      meaning:
        "Unusual noises or hesitation can indicate maintenance needs. Don’t assume the cause — verify with evidence.",
      ask:
        "Ask for service history and whether any warnings/noises were inspected recently (invoice helps).",
      hint: "Noises under load are worth treating as higher caution until proven otherwise.",
    };
  }

  if (
    label.includes("seat") ||
    label.includes("interior") ||
    label.includes("trim") ||
    label.includes("belt") ||
    label.includes("airbag")
  ) {
    return {
      meaning:
        "Interior wear is common, but disturbed trims/seatbelt issues can matter for safety or resale.",
      ask:
        "Ask if any airbags/seatbelts were repaired or replaced and whether there’s documentation.",
      hint: "Safety-related trim disturbances warrant stronger verification.",
    };
  }

  if (
    label.includes("adas") ||
    label.includes("lane") ||
    label.includes("sensor") ||
    label.includes("parking")
  ) {
    return {
      meaning:
        "Driver-assist warnings can be a simple sensor issue or something that needs diagnosis.",
      ask:
        "Ask what the warning was and whether it’s been scanned/diagnosed (report helps).",
      hint: "Intermittent warnings are worth verifying before committing.",
    };
  }

  // Default: calm, generic guidance.
  return {
    meaning:
      "This can be benign or meaningful depending on evidence. Treat it as a prompt to verify.",
    ask:
      "Ask for evidence (invoice, inspection note, written confirmation) that explains or resolves it.",
    hint:
      "If the seller can’t show evidence, it’s reasonable to pause or negotiate based on uncertainty.",
  };
}

function safeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* =======================================================
   Page
======================================================= */
export default function InPersonResults() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const progress: any = loadProgress();

  /* -------------------------------------------------------
     Routing safety
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [scanId, navigate]);

  if (!scanId) return null;

  /* -------------------------------------------------------
     Analysis
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    return analyseInPersonInspection(progress);
  }, [progress]);

  const photos: string[] = (progress?.photos ?? []).map((p: any) => p.dataUrl);

  const criticalRisks = analysis.risks.filter((r) => r.severity === "critical");
  const moderateRisks = analysis.risks.filter((r) => r.severity === "moderate");

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const evidenceSummary = (analysis as any).evidenceSummary;
  const evidenceText = pickFirstUsefulText(evidenceSummary);
  const evidenceBulletsRaw = extractEvidenceBullets(evidenceSummary);

  const askingPrice =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);
  const coverage = clamp(Number(analysis.completenessScore ?? 0), 0, 100);

  const concernsCount = criticalRisks.length + moderateRisks.length;

  const imperfectionsCount = Array.isArray(progress?.imperfections)
    ? progress.imperfections.length
    : 0;

  /* -------------------------------------------------------
     Verdict meta (tone + positioning)
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: "Proceed (with normal checks)",
      tone: "border-emerald-500/40 bg-emerald-500/10",
      short: "Proceed normally",
    },
    caution: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Proceed after clarification",
      tone: "border-amber-500/40 bg-amber-500/10",
      short: "Clarify first",
    },
    "walk-away": {
      icon: <XCircle className="h-6 w-6 text-rose-400" />,
      title: "Pause / walk away is reasonable",
      tone: "border-rose-500/40 bg-rose-500/10",
      short: "Pause / walk away",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Curated signals (no duplicates / no “minor note” spam)
  ------------------------------------------------------- */
  const topSignals = useMemo(() => {
    const out: Array<{ label: string; tone: SignalTone }> = [];

    for (const r of criticalRisks.slice(0, 3)) {
      if ((r.label || "").trim()) out.push({ label: r.label, tone: "critical" });
    }
    for (const r of moderateRisks.slice(0, 3)) {
      if ((r.label || "").trim()) out.push({ label: r.label, tone: "moderate" });
    }

    if (out.length === 0 && uncertaintyFactors.length > 0) {
      out.push({ label: "Some items were marked as unsure", tone: "unknown" });
    }

    const seen = new Set<string>();
    const deduped: Array<{ label: string; tone: SignalTone }> = [];
    for (const s of out) {
      const key = (s.label || "").trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    return deduped.slice(0, 6);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  /* -------------------------------------------------------
     Buyer-first “what to do next” + “top priorities”
  ------------------------------------------------------- */
  const nextSteps = useMemo(() => {
    const steps: string[] = [];

    if (analysis.verdict === "walk-away") {
      steps.push(
        "Start with the highest-impact items. If the seller can’t show evidence, pausing is sensible."
      );
    } else if (analysis.verdict === "caution") {
      steps.push(
        "Clarify the items you flagged before committing. Evidence beats reassurance."
      );
    } else {
      steps.push(
        "Proceed normally, but still verify the basics: paperwork match, service proof, and warning lights."
      );
    }

    if (uncertaintyFactors.length > 0) {
      steps.push("Treat unsure items as unknowns — verify them before you decide.");
    }

    if (!askingPrice) {
      steps.push(
        "Add the asking price (optional) to help with price alignment on the summary page."
      );
    }

    steps.push(
      "If you’re short on time, prioritise evidence: service history, invoices, and written confirmation."
    );

    return steps.slice(0, 4);
  }, [analysis.verdict, uncertaintyFactors.length, askingPrice]);

  const clarifyQuestions = useMemo(() => {
    const qs: string[] = [];

    for (const r of [...criticalRisks, ...moderateRisks]) {
      const label = (r.label || "").trim();
      if (!label) continue;
      qs.push(
        `Can you show evidence that “${label}” is explained or resolved (invoice, inspection note, photos, or written confirmation)?`
      );
    }

    if (qs.length === 0 && uncertaintyFactors.length > 0) {
      qs.push(
        "Can you confirm the items I couldn’t verify today (service proof, repairs, warnings, or faults) in writing?"
      );
    }

    if (qs.length === 0) {
      qs.push("Can you show the most recent service invoice and any repair history?");
      qs.push("Are there any known faults, warnings, or upcoming maintenance due soon?");
    }

    return qs.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const whyThisVerdict =
    (analysis as any).whyThisVerdict || (analysis as any).verdictReason || "";

  const scoreBlurb = useMemo(() => {
    if (coverage < 40) {
      return "You didn’t capture much coverage. This result is cautious by design — verify more before committing.";
    }
    if (confidence < 45) {
      return "Confidence is moderate because at least one item needs verification. Use the checklist below to reduce uncertainty.";
    }
    return "Confidence is based only on what you recorded. It doesn’t assume anything you didn’t check.";
  }, [coverage, confidence]);

  /* -------------------------------------------------------
     Guided meaning cards for each captured signal
  ------------------------------------------------------- */
  const guidedCards = useMemo(() => {
    const items = [...criticalRisks, ...moderateRisks].slice(0, 8);

    return items.map((r) => {
      const label = (r.label || "").trim() || "Recorded item";
      const tone: SignalTone = r.severity === "critical" ? "critical" : "moderate";
      const meaning = buyerMeaningFromLabel(label);
      const explanation = (r.explanation || "").trim();

      return {
        id: r.id || safeKey(label),
        label,
        tone,
        meaning,
        explanation,
      };
    });
  }, [criticalRisks, moderateRisks]);

  /* -------------------------------------------------------
     Clean quick log (dedupe, remove “minor note” duplicates)
  ------------------------------------------------------- */
  const evidenceBullets = useMemo(() => {
    const raw = evidenceBulletsRaw
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const cleaned = raw
      .map((s) => s.replace(/^minor note:\s*/i, "").trim())
      .map((s) =>
        s
          .replace(/\s*\(during the drive\)\s*/i, " ")
          .replace(/\s+/g, " ")
          .trim()
      );

    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of cleaned) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }

    return out;
  }, [evidenceBulletsRaw]);

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
      {/* HEADER */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · In-person report
        </span>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-400">
          <span>Scan ID: {scanId}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
          <span>Asking price: {formatMoney(askingPrice)}</span>
        </div>
      </header>

      {/* EXECUTIVE OUTCOME */}
      <section className={`rounded-2xl border px-8 py-8 space-y-6 ${verdictMeta.tone}`}>
        <div className="flex items-start gap-4">
          {verdictMeta.icon}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              {verdictMeta.title}
            </h1>

            <p className="text-[15px] leading-relaxed text-slate-200 max-w-3xl">
              {outcomeOneLiner(analysis.verdict)}
            </p>

            <Paragraph value={whyThisVerdict} tone="normal" />
          </div>
        </div>

        {/* Buyer snapshot */}
        <div className="rounded-2xl border border-white/12 bg-slate-950/30 px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Things to clarify
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {concernsCount}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Marked unsure
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {uncertaintyFactors.length}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Photos captured
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {photos.length}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                Imperfections
              </div>
              <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
                {imperfectionsCount}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-slate-400">
            <Info className="h-4 w-4 mt-0.5 text-slate-400" />
            <p className="text-xs leading-relaxed">
              These counts reflect what the report is acting on (things to clarify + unsure).
              “Coverage” and “confidence” are still used internally, but this is the buyer-facing snapshot.
            </p>
          </div>
        </div>

        {/* TOP SIGNALS */}
        {topSignals.length > 0 && (
          <div className="rounded-2xl border border-white/12 bg-slate-950/30 px-5 py-4">
            <div className="flex items-center gap-2 text-slate-200">
              <ShieldCheck className="h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold">Key signals (from your inspection)</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {topSignals.map((s, i) => (
                <span
                  key={i}
                  className={[
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                    severityPillClasses(s.tone),
                  ].join(" ")}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">{scoreBlurb}</p>
      </section>

      {/* GUIDED NEXT STEPS */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">What to do next (buyer-safe)</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400">
            This is calm guidance based only on what you recorded. It avoids hype and avoids assumptions.
          </p>

          <BulletList items={nextSteps} />

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/scan/in-person/decision")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
            >
              Open decision guide
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => navigate("/scan/in-person/summary")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Back to summary
            </button>
          </div>
        </div>
      </section>

      {/* “WHAT THIS MEANS” */}
      {guidedCards.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            What your signals most likely mean (plain English)
          </h2>

          <div className="space-y-4">
            {guidedCards.map((c) => {
              const pill = severityPillClasses(c.tone);

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/12 bg-slate-900/55 px-6 py-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-semibold text-white">{c.label}</p>
                    <span
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                        pill,
                      ].join(" ")}
                    >
                      {c.tone === "critical"
                        ? "Higher impact"
                        : c.tone === "moderate"
                        ? "Worth clarifying"
                        : "Unknown"}
                    </span>
                  </div>

                  {c.explanation ? (
                    <Paragraph value={c.explanation} tone="normal" />
                  ) : (
                    <Paragraph value={c.meaning.meaning} tone="normal" />
                  )}

                  <div className="grid gap-3 md:grid-cols-3 pt-1">
                    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        What it could mean
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {c.meaning.meaning}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        What to ask
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {c.meaning.ask}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Price impact hint
                      </div>
                      <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                        {c.meaning.hint}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Buyer-safe note: this does not diagnose the car — it highlights what to verify.
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CLARIFY WITH SELLER */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-200">
          What to clarify before you commit
        </h2>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400">
            Use these as a checklist. The goal is clarity — not confrontation.
          </p>

          <BulletList items={clarifyQuestions} />
        </div>
      </section>

      {/* DECLARED UNCERTAINTY */}
      {uncertaintyFactors.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Items you marked as unsure
          </h2>

          <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6">
            <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
              {uncertaintyFactors.map((u, i) => (
                <li key={i}>{UncertaintyText(u)}</li>
              ))}
            </ul>

            <p className="text-xs text-slate-500 mt-4">
              Unsure means unknown — not “safe” and not “dangerous”. Treat it as a prompt to verify.
            </p>
          </div>
        </section>
      )}

      {/* EVIDENCE BASIS */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-200">Evidence you recorded</h2>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-5">
          {evidenceText ? (
            <Paragraph value={evidenceText} tone="normal" />
          ) : (
            <p className="text-[14px] text-slate-400">
              No written evidence summary was generated — your selections and photos were still used to form the result.
            </p>
          )}

          {evidenceBullets.length > 0 && (
            <div className="pt-1">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
                What you captured (quick log)
              </div>
              <BulletList items={evidenceBullets} />
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Confidence (how cautious this is)
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-slate-300">
              <div>
                <div className="text-slate-500 text-xs">Confidence</div>
                <div className="text-white font-semibold">{confidence}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Coverage</div>
                <div className="text-white font-semibold">{coverage}%</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Items to clarify</div>
                <div className="text-white font-semibold">{concernsCount}</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-3xl">
            This assessment uses only what you recorded and what you explicitly marked as unsure.
            Missing items are treated as “not recorded”, not as risk.
          </p>
        </div>
      </section>

      {/* PHOTO EVIDENCE */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Camera className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Photos captured</h2>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((src, i) => (
              <img
                key={`${safeKey(src)}-${i}`}
                src={src}
                alt={`Inspection photo ${i + 1}`}
                className="rounded-xl border border-white/10 object-cover aspect-square"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No photos were captured during this inspection.
          </p>
        )}
      </section>

      {/* ACTIONS */}
      <section className="space-y-4 pt-2">
        <button
          onClick={() => navigate("/scan/in-person/decision")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 text-base"
        >
          Decision & next steps
        </button>

        <button
          onClick={() => navigate("/scan/in-person/print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          Print / save report
        </button>
      </section>
    </div>
  );
}
