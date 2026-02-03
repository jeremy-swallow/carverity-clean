import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import {
  analyseInPersonInspection,
  type AnalysisResult,
} from "../utils/inPersonAnalysis";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  CheckCircle2,
  Info,
  ClipboardList,
  Eye,
  Car,
  BadgeDollarSign,
  Flag,
  ArrowRight,
} from "lucide-react";
import {
  buildGuidedPricePositioning,
  type GuidedPricingOutput,
} from "../utils/decisionPricing";

/* =======================================================
   Small helpers
======================================================= */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
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

type Tone = "good" | "info" | "warn" | "danger";
type NextCheckTone = "critical" | "moderate" | "unsure";

function toneClasses(tone: Tone) {
  if (tone === "good") {
    return {
      wrap: "border-emerald-500/25 bg-emerald-500/10",
      icon: "text-emerald-300",
      pill: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
      cta: "bg-emerald-500 hover:bg-emerald-400 text-black",
    };
  }
  if (tone === "warn") {
    return {
      wrap: "border-amber-500/25 bg-amber-500/10",
      icon: "text-amber-300",
      pill: "border-amber-500/20 bg-amber-500/10 text-amber-200",
      cta: "bg-amber-400 hover:bg-amber-300 text-black",
    };
  }
  if (tone === "danger") {
    return {
      wrap: "border-rose-500/25 bg-rose-500/10",
      icon: "text-rose-300",
      pill: "border-rose-500/20 bg-rose-500/10 text-rose-200",
      cta: "bg-rose-500 hover:bg-rose-400 text-black",
    };
  }
  return {
    wrap: "border-sky-500/25 bg-sky-500/10",
    icon: "text-sky-300",
    pill: "border-sky-500/20 bg-sky-500/10 text-sky-200",
    cta: "bg-sky-500 hover:bg-sky-400 text-black",
  };
}

function nextCheckToneStyles(tone: NextCheckTone) {
  if (tone === "critical") {
    return {
      wrap: "border-rose-500/30 bg-rose-500/10",
      icon: "text-rose-300",
      why: "Resolving this removes the biggest risk in your decision.",
      after:
        "If this can’t be verified cleanly, walking away becomes the safer option.",
    };
  }

  if (tone === "moderate") {
    return {
      wrap: "border-amber-500/30 bg-amber-500/10",
      icon: "text-amber-300",
      why: "Clarifying this reduces uncertainty before you commit.",
      after:
        "Once confirmed, your recommended offer range may move closer to the asking price.",
    };
  }

  return {
    wrap: "border-white/15 bg-white/5",
    icon: "text-slate-300",
    why: "Confirming this turns an unknown into a known.",
    after: "This helps you decide whether to proceed confidently or pause.",
  };
}

function confidenceLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 35) return "Low";
  return "Very low";
}

function confidenceMeaning(score: number) {
  if (score >= 80) return "You captured enough detail for a strong read.";
  if (score >= 60) return "Good coverage — a few unknowns remain.";
  if (score >= 35)
    return "Several unknowns — verify key items before deciding.";
  return "Many unknowns — treat this as a first pass, not a final call.";
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function parseAudNumber(input: string): number | null {
  const cleaned = String(input ?? "").replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n > 0 ? n : null;
}

/* =======================================================
   Page
======================================================= */

export default function InPersonDecision() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();
  const scanIdSafe = scanId ? String(scanId) : "";
const [progress, setProgress] = useState<any>(() => loadProgress());

  const analysis: AnalysisResult = useMemo(() => {
    return analyseInPersonInspection((progress ?? {}) as any);
  }, [progress]);

  const critical = analysis.risks.filter((r) => r.severity === "critical");
  const moderate = analysis.risks.filter((r) => r.severity === "moderate");

  const unsure: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);

  /* =====================================================
     Asking price capture (guided, non-formy) — FIXED
  ===================================================== */

  const initialAsking = useMemo(() => {
    const v = progress?.askingPrice;
    if (isFiniteNumber(v)) return Number(v);
    if (typeof v === "string") return parseAudNumber(v);
    return null;
  }, [progress]);

  // Keep RAW text so typing never locks. Parse separately.
  const [askingInput, setAskingInput] = useState<string>(
    initialAsking != null ? String(Math.round(initialAsking)) : ""
  );
  const [askingSaved, setAskingSaved] = useState<boolean>(false);
  
  // Keep input in sync if askingPrice already exists (e.g. returning to page)
  useEffect(() => {
  const stored = progress?.askingPrice;

  // Hydrate once on mount so the field pre-fills,
  // but never fights the user while typing.
  if (isFiniteNumber(stored)) {
    setAskingInput(String(Math.round(stored)));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const askingPriceParsed = useMemo(() => {
    return parseAudNumber(askingInput);
  }, [askingInput]);

  function saveAskingPrice() {
    const n = askingPriceParsed;
    if (!n) return;

    try {

setAskingInput(String(n));
      setAskingSaved(true);
      window.setTimeout(() => setAskingSaved(false), 1500);
    } catch {
      // If save fails, we simply don't show the saved tick.
      setAskingSaved(false);
    }
  }

  /* =====================================================
     Mirrored guidance: best next verification
  ===================================================== */

  const bestNext = useMemo(() => {
    if (critical.length > 0 && (critical[0] as any)?.label) {
      return {
        tone: "critical" as NextCheckTone,
        text: `Resolve “${String((critical[0] as any).label).trim()}” with written or photographic evidence.`,
      };
    }

    if (moderate.length > 0 && (moderate[0] as any)?.label) {
      return {
        tone: "moderate" as NextCheckTone,
        text: `Clarify “${String((moderate[0] as any).label).trim()}” and confirm it doesn’t indicate a larger issue.`,
      };
    }

    if (unsure.length > 0) {
      return {
        tone: "unsure" as NextCheckTone,
        text:
          "Confirm the most important item you marked as unsure — treat it as unknown until verified.",
      };
    }

    return {
      tone: "unsure" as NextCheckTone,
      text:
        "Ask for the most recent service invoice and confirm service history in writing.",
    };
  }, [critical, moderate, unsure.length]);

  const bestNextTone = useMemo(
    () => nextCheckToneStyles(bestNext.tone),
    [bestNext.tone]
  );

  /* =====================================================
     Decision posture
  ===================================================== */

  const posture = useMemo(() => {
    if (analysis.verdict === "walk-away") {
      return {
        title: "Decision posture: pausing or walking away is reasonable",
        body:
          "Based on what you recorded, risk looks elevated. If the seller can’t resolve the key items with clear evidence, walking away is a buyer-safe outcome.",
        tone: "danger" as Tone,
        icon: AlertTriangle,
        cta: "Re-check the high-impact items",
      };
    }

    if (analysis.verdict === "caution") {
      return {
        title: "Decision posture: proceed after clarification",
        body:
          "You recorded one or more meaningful concerns or unknowns. Clarify those items first, then decide with fewer regrets.",
        tone: "warn" as Tone,
        icon: HelpCircle,
        cta: "Clarify what you flagged",
      };
    }

    return {
      title: "Decision posture: proceed normally",
      body:
        "Nothing you recorded strongly suggests elevated risk. Confirm the basics and proceed with normal buyer checks.",
      tone: "good" as Tone,
      icon: CheckCircle2,
      cta: "Proceed with normal checks",
    };
  }, [analysis.verdict]);

  const postureTone = toneClasses(posture.tone);

  /* =====================================================
     Recommendation highlight
  ===================================================== */

  const recommendedNextAction = useMemo(() => {
    if (analysis.verdict === "walk-away") {
      return {
        title: "Recommended next action",
        body:
          "Re-check the high-impact items once more and ask for evidence. If it can’t be verified cleanly and quickly, walking away is the buyer-safe call.",
        icon: AlertTriangle,
      };
    }

    if (analysis.verdict === "caution") {
      return {
        title: "Recommended next action",
        body:
          "Clarify your flagged items now using proof (invoices, written confirmation, photos). Vague answers should be treated as risk, not reassurance.",
        icon: HelpCircle,
      };
    }

    return {
      title: "Recommended next action",
      body:
        "Proceed with normal checks: confirm service history, confirm identity and paperwork, and make sure nothing new appears on a second look.",
      icon: ShieldCheck,
    };
  }, [analysis.verdict]);

  const RecIcon = recommendedNextAction.icon;

  /* =====================================================
     Guided price positioning (core new UX section)
  ===================================================== */

  const pricing: GuidedPricingOutput = useMemo(() => {
    const verdict =
      analysis.verdict === "walk-away" ||
      analysis.verdict === "caution" ||
      analysis.verdict === "proceed"
        ? analysis.verdict
        : "caution";

   const asking = isFiniteNumber(progress?.askingPrice)
  ? Number(progress.askingPrice)
  : null;

    return buildGuidedPricePositioning({
      askingPrice: asking,
      verdict,
      confidenceScore: confidence,
      criticalCount: critical.length,
      moderateCount: moderate.length,
      unsureCount: unsure.length,
    });
    }, [
    analysis.verdict,
    confidence,
    critical.length,
    moderate.length,
    unsure.length,
    progress?.askingPrice,
  ]);

  /* =====================================================
     Evidence & reality checks
  ===================================================== */

  const topTakeaways = useMemo(() => {
    const lines: string[] = [];

    if (critical.length > 0) {
      lines.push(
        `${critical.length} high-impact item${
          critical.length === 1 ? "" : "s"
        } to resolve before committing.`
      );
    } else {
      lines.push("No high-impact items were recorded.");
    }

    if (moderate.length > 0) {
      lines.push(
        `${moderate.length} medium-risk item${
          moderate.length === 1 ? "" : "s"
        } worth clarifying.`
      );
    } else {
      lines.push("No medium-risk items were recorded.");
    }

    if (unsure.length > 0) {
      lines.push(
        `${unsure.length} unknown${
          unsure.length === 1 ? "" : "s"
        } — treat these as questions, not negatives.`
      );
    } else {
      lines.push("No key unknowns were recorded.");
    }

    return lines.slice(0, 3);
  }, [critical.length, moderate.length, unsure.length]);

  const beforeYouCommit = useMemo(() => {
    const items: string[] = [];

    items.push(
      "Confirm the seller’s identity and that the paperwork matches the vehicle."
    );
    items.push("Verify service history with invoices (not just a stamp book).");
    items.push(
      "Check for finance owing or written-off status (where applicable)."
    );

    if (critical.length > 0) {
      items.push(
        "Do not pay a deposit until the high-impact items are resolved with evidence."
      );
    }

    if (moderate.length > 0) {
      items.push(
        "Ask the seller to clarify the items you flagged before committing."
      );
    }

    if (unsure.length > 0) {
      items.push(
        "Treat unsure items as unknowns and verify them before deciding."
      );
    }

    return items.slice(0, 7);
  }, [critical.length, moderate.length, unsure.length]);

  const evidenceRequests = useMemo(() => {
    const req: string[] = [];

    for (const r of [...critical, ...moderate]) {
      const label = (r.label || "").trim();
      if (!label) continue;

      req.push(
        `Request proof resolving “${label}” (invoice, written confirmation, photos, or inspection note).`
      );
    }

    if (req.length === 0) {
      req.push(
        "Ask for the most recent service invoice and any recent repair receipts."
      );
      req.push(
        "Ask whether there are any known faults, warnings, or maintenance due soon."
      );
    }

    return req.slice(0, 6);
  }, [critical, moderate]);

  const whatGoodLooksLike = useMemo(() => {
    const good: string[] = [];

    good.push(
      "The seller provides clear evidence for your concerns in writing or invoices."
    );
    good.push("Your unknown items become confirmed rather than remaining unknown.");
    good.push("No new warning lights or behaviours appear on a second look.");

    if (analysis.verdict === "proceed") {
      good.push(
        "Your recorded inspection stays consistent with no new concerns emerging."
      );
    }

    return good.slice(0, 5);
  }, [analysis.verdict]);

  const whenToWalk = useMemo(() => {
    const bad: string[] = [];

    bad.push(
      "The seller refuses reasonable verification or discourages basic checks."
    );

    if (critical.length > 0) {
      bad.push(
        "A high-impact item remains unresolved or worsens after re-checking."
      );
    }

    if (unsure.length > 0) {
      bad.push(
        "Too many key items remain unknown and an independent inspection isn’t allowed."
      );
    }

    bad.push("You feel pressured to commit quickly or rushed through the process.");

    return bad.slice(0, 6);
  }, [critical.length, unsure.length]);

  /* =====================================================
     Render
  ===================================================== */

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={() => navigate("/scan/in-person/results/" + scanIdSafe)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Review inspection report
        </button>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Decision & next steps
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Calm, buyer-safe guidance based only on what you recorded. No scripts.
          No pressure. Just a clear posture and the next few actions that reduce
          regret.
        </p>
      </div>

      {/* NEW: Guided “verify next” card (mirrored from Results, reframed for Decision) */}
      <section
        className={["rounded-2xl border px-5 py-5 space-y-4", bestNextTone.wrap].join(
          " "
        )}
      >
        <div className="flex items-center gap-2 text-slate-200">
          <Flag className={["h-4 w-4", bestNextTone.icon].join(" ")} />
          <h2 className="text-sm font-semibold">
            To move forward with confidence, verify this next
          </h2>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed">{bestNext.text}</p>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 mt-0.5 text-slate-300" />
            <span className="text-slate-300">{bestNextTone.why}</span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <ArrowRight className="h-4 w-4 mt-0.5 text-slate-300" />
            <span className="text-slate-300">{bestNextTone.after}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">One clear action now reduces regret later.</p>
      </section>

      {/* Chapter 1: Decision anchor */}
      <section className={["rounded-2xl border px-5 py-6 space-y-4", postureTone.wrap].join(" ")}>
        <div className="flex items-start gap-3">
          <posture.icon className={["h-5 w-5 mt-0.5", postureTone.icon].join(" ")} />

          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold text-white">{posture.title}</p>
            <p className="text-sm text-slate-200 leading-relaxed">{posture.body}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
              postureTone.pill,
            ].join(" ")}
          >
            <Eye className={["h-4 w-4", postureTone.icon].join(" ")} />
            Inspection confidence: {confidenceLabel(confidence)} ({confidence}%)
          </span>

          <span className="text-xs text-slate-300">{confidenceMeaning(confidence)}</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              CarVerity doesn’t fill gaps. If something wasn’t checked, it stays
              an unknown and is treated as a question to verify — not as good or
              bad.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/scan/in-person/results/" + scanIdSafe)}
          className={[
            "w-full rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2",
            postureTone.cta,
          ].join(" ")}
        >
          <Car className="h-4 w-4" />
          {posture.cta}
        </button>
      </section>

      {/* Recommendation highlight */}
      <section className="rounded-2xl border border-white/20 bg-slate-900/80 px-5 py-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <RecIcon className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold">{recommendedNextAction.title}</h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{recommendedNextAction.body}</p>
      </section>

      {/* Chapter: Price positioning (guided, not a dump) */}
      <section
        className={[
          "rounded-2xl border px-5 py-5 space-y-4",
          analysis.verdict === "walk-away"
            ? "border-rose-500/15 bg-rose-500/5"
            : "border-white/12 bg-slate-900/70",
        ].join(" ")}
      >
        <div className="flex items-center gap-2 text-slate-200">
          <BadgeDollarSign
            className={[
              "h-4 w-4",
              analysis.verdict === "walk-away" ? "text-rose-300" : "text-slate-300",
            ].join(" ")}
          />
          <h2 className="text-sm font-semibold">{pricing.title}</h2>
        </div>

        {pricing.mode === "needs_price" && (
          <>
            <p className="text-sm text-slate-300 leading-relaxed">{pricing.guidance[0]}</p>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 space-y-3">
              <p className="text-xs text-slate-400">
                Enter the seller’s asking price to unlock guided ranges.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Asking price (AUD)
                  </label>
                  <input
                    type="text"
                    value={askingInput}
                    onChange={(e) => setAskingInput(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    placeholder="e.g. 18990"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveAskingPrice}
                  disabled={!askingPriceParsed}
                  className={[
                    "rounded-xl px-4 py-3 text-sm font-semibold transition",
                    askingPriceParsed
                      ? "bg-white text-black hover:bg-slate-100"
                      : "bg-white/10 text-slate-400 cursor-not-allowed",
                  ].join(" ")}
                >
                  {askingSaved ? "Saved ✓" : "Save price"}
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{pricing.disclaimer}</p>
            </div>

            <ul className="text-sm text-slate-300 space-y-2">
              {pricing.guidance.slice(1).map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </>
        )}

        {pricing.mode === "ok" && (
          <>
            <p className="text-sm text-slate-300 leading-relaxed">{pricing.subtitle}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
    Asking price:{" "}
    <span className="text-slate-200 font-semibold">
      {formatMoney(progress?.askingPrice ?? null)}
    </span>
  </span>

  <button
  type="button"
  onClick={() => {
    const next = { ...(progress ?? {}) };
    delete next.askingPrice;
    saveProgress(next);
    setProgress(next);
  }}
  className="rounded-full ..."
>
  Edit price
</button>

  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
    {pricing.confidenceNote}
  </span>
</div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                What to do first
              </p>
              <ul className="text-sm text-slate-300 space-y-2">
                {pricing.howToUse.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Offer bands
              </p>

              <div className="grid grid-cols-1 gap-3">
                {pricing.bands.map((b) => (
                  <div
                    key={b.key}
                    className={[
                      "rounded-xl border px-4 py-4 space-y-1",
                      b.emphasis
                        ? "border-white/25 bg-white/5"
                        : analysis.verdict === "walk-away"
                        ? "border-white/10 bg-white/0 opacity-90"
                        : "border-white/10 bg-white/0",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {b.label}
                        {b.emphasis ? (
                          <span className="ml-2 text-xs text-slate-300 font-semibold">
                            (recommended)
                          </span>
                        ) : null}
                      </p>
                      <p className="text-sm font-semibold text-slate-200">
                        {formatMoney(b.min)} – {formatMoney(b.max)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{b.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Why this range exists
              </p>
              <ul className="text-sm text-slate-300 space-y-2">
                {pricing.whyThisRange.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                What moves the range upward
              </p>
              <ul className="text-sm text-slate-300 space-y-2">
                {pricing.whatMovesItUp.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>

            <div className="pt-1">
              <ul className="text-xs text-slate-500 space-y-2">
                {pricing.guardrails.map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-200">
            <ClipboardList className="h-4 w-4 text-slate-300" />
            <h2 className="text-sm font-semibold">Your key takeaways</h2>
          </div>

          <ul className="text-sm text-slate-300 space-y-2">
            {topTakeaways.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <h2 className="text-sm font-semibold">Before you commit</h2>
          </div>

          <ul className="text-sm text-slate-300 space-y-2">
            {beforeYouCommit.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-200">
            <FileCheck className="h-4 w-4 text-slate-300" />
            <h2 className="text-sm font-semibold">What to ask for (evidence)</h2>
          </div>

          <ul className="text-sm text-slate-300 space-y-2">
            {evidenceRequests.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <h2 className="text-sm font-semibold">What “good” looks like</h2>
          </div>

          <ul className="text-sm text-slate-300 space-y-2">
            {whatGoodLooksLike.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-200">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <h2 className="text-sm font-semibold">When walking away is reasonable</h2>
          </div>

          <ul className="text-sm text-slate-300 space-y-2">
            {whenToWalk.map((t, i) => (
              <li key={i}>• {t}</li>
            ))}
          </ul>

          <p className="text-xs text-slate-500">
            CarVerity is designed to reduce regret — not to push you into a
            decision.
          </p>
        </section>
      </div>

      <button
        onClick={() => navigate("/scan/in-person/results/" + scanIdSafe)}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
      >
        Review inspection report
      </button>
    </div>
  );
}
