// src/pages/InPersonDecision.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
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
} from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Tone = "good" | "info" | "warn" | "danger";

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

function confidenceLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  if (score >= 35) return "Low";
  return "Very low";
}

function confidenceMeaning(score: number) {
  if (score >= 80) return "You captured enough detail for a strong read.";
  if (score >= 60) return "Good coverage — a few unknowns remain.";
  if (score >= 35) return "Several unknowns — verify key items before deciding.";
  return "Many unknowns — treat this as a first pass, not a final call.";
}

export default function InPersonDecision() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  const analysis: AnalysisResult = useMemo(() => {
    return analyseInPersonInspection((progress ?? {}) as any);
  }, [progress]);

  const critical = analysis.risks.filter((r) => r.severity === "critical");
  const moderate = analysis.risks.filter((r) => r.severity === "moderate");

  const unsure: unknown[] = Array.isArray((analysis as any).uncertaintyFactors)
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);

  const posture = useMemo(() => {
    if (analysis.verdict === "walk-away") {
      return {
        title: "Decision posture: pause / walking away is reasonable",
        body:
          "Based on what you recorded, risk looks elevated. If the seller can’t resolve the key items with evidence, walking away is a buyer-safe choice.",
        tone: "danger" as Tone,
        icon: AlertTriangle,
        cta: "Re-check the key items",
      };
    }

    if (analysis.verdict === "caution") {
      return {
        title: "Decision posture: proceed after clarification",
        body:
          "You recorded at least one meaningful concern or unknown. Clarify those items first — then decide with confidence.",
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

  const beforeYouCommit = useMemo(() => {
    const items: string[] = [];

    items.push(
      "Confirm the seller’s identity and that the paperwork matches the vehicle."
    );
    items.push("Verify service history with invoices (not just a stamp book).");
    items.push("Check for finance owing / written-off status (where applicable).");

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
      items.push("Treat unsure items as unknowns — verify them before you decide.");
    }

    return items.slice(0, 7);
  }, [critical.length, moderate.length, unsure.length]);

  const evidenceRequests = useMemo(() => {
    const req: string[] = [];

    for (const r of [...critical, ...moderate]) {
      const label = (r.label || "").trim();
      if (!label) continue;

      req.push(
        `Request evidence resolving: “${label}” (invoice, inspection note, photos, or written confirmation).`
      );
    }

    if (req.length === 0) {
      req.push("Ask for the most recent service invoice and any recent repair receipts.");
      req.push("Ask if there are any known faults, warnings, or upcoming maintenance due soon.");
    }

    return req.slice(0, 6);
  }, [critical, moderate]);

  const whatGoodLooksLike = useMemo(() => {
    const good: string[] = [];

    good.push("The seller can show clear evidence for your concerns (in writing or invoices).");
    good.push("Your unknown items become “confirmed” rather than “unknown”.");
    good.push("No new warning lights or behaviours appear on a second look.");

    if (analysis.verdict === "proceed") {
      good.push("Your recorded inspection stays consistent — no additional concerns emerge.");
    }

    return good.slice(0, 5);
  }, [analysis.verdict]);

  const whenToWalk = useMemo(() => {
    const bad: string[] = [];

    bad.push("The seller refuses reasonable verification (invoices, proof, written confirmation).");

    if (critical.length > 0) {
      bad.push("A high-impact item remains unresolved or worsens after re-checking.");
    }

    if (unsure.length > 0) {
      bad.push("Too many key items remain unknown, and an independent inspection isn’t allowed.");
    }

    bad.push("You feel pressured to commit quickly or discouraged from checking basics.");

    return bad.slice(0, 6);
  }, [critical.length, unsure.length]);

  const postureTone = toneClasses(posture.tone);

  const topTakeaways = useMemo(() => {
    const lines: string[] = [];

    if (critical.length > 0) {
      lines.push(
        `${critical.length} high-impact item${
          critical.length === 1 ? "" : "s"
        } to resolve before you commit.`
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

  const scanId = progress?.scanId ?? "";

  // 🔥 Recommendation (my take)
  // If the user recorded ANY critical OR lots of unknowns, encourage re-checking.
  // Otherwise, encourage confirming basics and proceeding.
  const recommendedNextAction = useMemo(() => {
    if (analysis.verdict === "walk-away") {
      return {
        title: "Recommended next action",
        body:
          "Re-check the high-impact items once more and ask for evidence. If it can’t be verified quickly and cleanly, walking away is the buyer-safe call.",
        icon: AlertTriangle,
      };
    }

    if (analysis.verdict === "caution") {
      return {
        title: "Recommended next action",
        body:
          "Clarify your flagged items now (service proof, written confirmation, photos). If the answers are vague or inconsistent, treat it as risk — not reassurance.",
        icon: HelpCircle,
      };
    }

    return {
      title: "Recommended next action",
      body:
        "Proceed with normal checks: confirm service history, confirm identity/paperwork, and make sure nothing new appears on a second look.",
      icon: ShieldCheck,
    };
  }, [analysis.verdict]);

  const RecIcon = recommendedNextAction.icon;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          onClick={() => navigate("/scan/in-person/results/" + scanId)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          View report
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Decision & next steps
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Buyer-safe guidance based only on what you recorded. No scripts. No
          pressure. Just a clear posture and the next few actions that reduce regret.
        </p>
      </div>

      {/* Posture */}
      <section
        className={[
          "rounded-2xl border px-5 py-5 space-y-4",
          postureTone.wrap,
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <posture.icon className={["h-5 w-5", postureTone.icon].join(" ")} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{posture.title}</p>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">
              {posture.body}
            </p>
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
            Confidence: {confidenceLabel(confidence)} ({confidence}%)
          </span>

          <span className="text-xs text-slate-300">
            {confidenceMeaning(confidence)}
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-slate-300 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              CarVerity doesn’t fill gaps. If you couldn’t check something, we keep it as an
              unknown and treat it as a question to verify.
            </p>
          </div>
        </div>

        {/* Strong CTA button */}
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/results/" + scanId)}
          className={[
            "w-full rounded-xl px-4 py-3 font-semibold transition inline-flex items-center justify-center gap-2",
            postureTone.cta,
          ].join(" ")}
        >
          <Car className="h-4 w-4" />
          {posture.cta}
        </button>
      </section>

      {/* My recommendation */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-200">
          <RecIcon className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold">{recommendedNextAction.title}</h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {recommendedNextAction.body}
        </p>
      </section>

      {/* Top takeaways */}
      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <ClipboardList className="h-4 w-4 text-slate-300" />
          <h2 className="text-sm font-semibold">Your key takeaways</h2>
        </div>

        <ul className="text-sm text-slate-300 space-y-2">
          {topTakeaways.map((t, i) => (
            <li key={i} className="leading-relaxed">
              • {t}
            </li>
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
            <li key={i} className="leading-relaxed">
              • {t}
            </li>
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
            <li key={i} className="leading-relaxed">
              • {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <h2 className="text-sm font-semibold">What “good” looks like</h2>
        </div>

        <ul className="text-sm text-slate-300 space-y-2">
          {whatGoodLooksLike.map((t, i) => (
            <li key={i} className="leading-relaxed">
              • {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold">
            When walking away is reasonable
          </h2>
        </div>

        <ul className="text-sm text-slate-300 space-y-2">
          {whenToWalk.map((t, i) => (
            <li key={i} className="leading-relaxed">
              • {t}
            </li>
          ))}
        </ul>

        <p className="text-xs text-slate-500">
          CarVerity is designed to reduce regret — not to push you into a decision.
        </p>
      </section>

      <button
        onClick={() => navigate("/scan/in-person/results/" + scanId)}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
      >
        Back to report
      </button>
    </div>
  );
}
