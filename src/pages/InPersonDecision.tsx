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
} from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
        title: "Buyer-safe decision posture: pause / walk away is reasonable",
        body:
          "Based on what you recorded, risk looks elevated. If the seller can’t clearly resolve the key items with evidence, walking away is a sensible choice.",
        tone: "border-red-500/30 bg-red-500/10",
        icon: <AlertTriangle className="h-5 w-5 text-red-300" />,
      };
    }

    if (analysis.verdict === "caution") {
      return {
        title: "Buyer-safe decision posture: proceed only after clarification",
        body:
          "You recorded at least one meaningful concern or uncertainty. Clarify those items first — then decide with confidence.",
        tone: "border-amber-500/30 bg-amber-500/10",
        icon: <HelpCircle className="h-5 w-5 text-amber-300" />,
      };
    }

    return {
      title: "Buyer-safe decision posture: proceed normally",
      body:
        "Nothing you recorded strongly suggests elevated risk. Confirm the basics and proceed with normal buyer checks.",
      tone: "border-emerald-500/30 bg-emerald-500/10",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
    };
  }, [analysis.verdict]);

  const beforeYouCommit = useMemo(() => {
    const items: string[] = [];

    items.push("Confirm the seller’s identity and that the paperwork matches the vehicle.");
    items.push("Verify service history with invoices (not just a stamp book).");
    items.push("Check for finance owing / written-off status (where applicable).");

    if (critical.length > 0) {
      items.push("Do not pay a deposit until the high-impact items are resolved with evidence.");
    }

    if (moderate.length > 0) {
      items.push("Ask the seller to clarify the items you flagged before committing.");
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
        `Ask for evidence resolving: “${label}” (invoice, inspection note, photos, or written confirmation).`
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
    good.push("Your unsure items become “confirmed” rather than “unknown”.");
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
          onClick={() =>
            navigate("/scan/in-person/results/" + (progress?.scanId ?? ""))
          }
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          View report
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Decision & next steps
        </h1>
        <p className="text-sm text-slate-400">
          Calm, buyer-safe guidance based only on what you recorded — no scripts,
          no hype.
        </p>
      </div>

      <section
        className={`rounded-2xl border px-5 py-5 space-y-3 ${posture.tone}`}
      >
        <div className="flex items-start gap-3">
          {posture.icon}
          <div>
            <p className="text-sm font-semibold text-white">{posture.title}</p>
            <p className="text-sm text-slate-200 mt-1 leading-relaxed">
              {posture.body}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300">
          Confidence score:{" "}
          <span className="font-semibold text-white">{confidence}%</span>
        </div>
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
          <h2 className="text-sm font-semibold">When walking away is reasonable</h2>
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
        onClick={() =>
          navigate("/scan/in-person/results/" + (progress?.scanId ?? ""))
        }
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3 font-semibold"
      >
        Back to report
      </button>
    </div>
  );
}
