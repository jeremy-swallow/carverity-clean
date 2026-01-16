// src/pages/InPersonResults.tsx

import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Camera,
  FileText,
  ClipboardCheck,
  HelpCircle,
  ArrowRight,
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

function Paragraph({ value }: { value: unknown }) {
  const t = asCleanText(value);
  if (!t) return null;
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl whitespace-pre-line">
      {t}
    </p>
  );
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

  const evidenceText = pickFirstUsefulText((analysis as any).evidenceSummary);

  /* -------------------------------------------------------
     Verdict meta (tone + positioning)
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: "Buyer-safe: proceed (with normal checks)",
      tone: "border-emerald-500/40 bg-emerald-500/10",
      posture:
        "Nothing you recorded strongly suggests elevated risk. Confirm the basics, then proceed normally.",
    },
    caution: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Buyer-safe: proceed only after clarification",
      tone: "border-amber-500/40 bg-amber-500/10",
      posture:
        "You recorded at least one meaningful concern or uncertainty. Clarify those items before committing.",
    },
    "walk-away": {
      icon: <XCircle className="h-6 w-6 text-red-400" />,
      title: "Buyer-safe: pause or walk away is reasonable",
      tone: "border-red-500/40 bg-red-500/10",
      posture:
        "Your recorded evidence suggests elevated risk. If the seller can’t resolve key items, walking away is sensible.",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Guided “next steps” generation (no scripts)
  ------------------------------------------------------- */
  const nextSteps = useMemo(() => {
    const steps: string[] = [];

    if (criticalRisks.length > 0) {
      steps.push(
        "Do not pay a deposit until the high-impact items are clearly resolved with evidence."
      );
    }

    if (moderateRisks.length > 0) {
      steps.push(
        "Ask the seller to clarify the items you flagged before you commit."
      );
    }

    if (uncertaintyFactors.length > 0) {
      steps.push(
        "Treat unsure items as unknowns — request proof or arrange an independent inspection if needed."
      );
    }

    if (steps.length === 0) {
      steps.push(
        "You recorded a clean inspection. Confirm service history and paperwork, then proceed normally."
      );
    }

    return steps.slice(0, 4);
  }, [criticalRisks.length, moderateRisks.length, uncertaintyFactors.length]);

  const clarifyQuestions = useMemo(() => {
    const qs: string[] = [];

    // Use risk labels to build “buyer-safe” clarification prompts
    for (const r of [...criticalRisks, ...moderateRisks]) {
      const label = (r.label || "").trim();
      if (!label) continue;

      qs.push(
        `Can you show evidence that the "${label}" concern has been addressed or explained (invoice, inspection note, photos, or written confirmation)?`
      );
    }

    // If no risks but uncertainties exist
    if (qs.length === 0 && uncertaintyFactors.length > 0) {
      qs.push(
        "Can you confirm the items I couldn’t verify today (service proof, repairs, warnings, or faults) in writing?"
      );
    }

    // Fallback
    if (qs.length === 0) {
      qs.push("Can you show the most recent service invoice and any repair history?");
      qs.push("Are there any known faults, warnings, or upcoming maintenance due soon?");
    }

    return qs.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);
  const coverage = clamp(Number(analysis.completenessScore ?? 0), 0, 100);

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
      {/* HEADER */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Buyer-safe inspection summary
        </span>

        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
          <span>Scan ID: {scanId}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </header>

      {/* EXECUTIVE VERDICT */}
      <section
        className={`rounded-2xl border px-8 py-8 space-y-6 ${verdictMeta.tone}`}
      >
        <div className="flex items-start gap-4">
          {verdictMeta.icon}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white leading-tight">
              {verdictMeta.title}
            </h1>

            <p className="text-[15px] leading-relaxed text-slate-200 max-w-3xl">
              {verdictMeta.posture}
            </p>

            <Paragraph value={(analysis as any).whyThisVerdict} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">
                Confidence
              </span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">
              {confidence}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Eye className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Coverage</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">
              {coverage}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Concerns</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">
              {analysis.risks.filter((r) => r.severity !== "info").length}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Unsure</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">
              {uncertaintyFactors.length}
            </p>
          </div>
        </div>
      </section>

      {/* GUIDED NEXT STEPS */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">What to do next (buyer-safe)</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400">
            This guidance is based only on what you recorded. It avoids hype and
            avoids assumptions.
          </p>

          <BulletList items={nextSteps} />

          <div className="pt-2">
            <button
              onClick={() => navigate("/scan/in-person/decision")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
            >
              Open decision guide
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

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

      {/* PRIORITY FINDINGS */}
      {criticalRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            High-impact items (resolve these first)
          </h2>

          <div className="space-y-4">
            {criticalRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-5"
              >
                <p className="text-base font-semibold text-white">{r.label}</p>
                <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                  {r.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {moderateRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Items worth clarifying
          </h2>

          <div className="space-y-4">
            {moderateRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5"
              >
                <p className="text-base font-medium text-slate-100">
                  {r.label}
                </p>
                <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                  {r.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
              Unsure means unknown — not “safe” and not “dangerous”. Treat it as
              a prompt to verify.
            </p>
          </div>
        </section>
      )}

      {/* EVIDENCE BASIS */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-200">
          Evidence you recorded
        </h2>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          {evidenceText ? (
            <Paragraph value={evidenceText} />
          ) : (
            <p className="text-[14px] text-slate-400">
              No written evidence summary was generated — your selections and
              photos were still used to form the result.
            </p>
          )}

          <p className="text-xs text-slate-500 max-w-3xl">
            This assessment uses only what you recorded and what you explicitly
            marked as unsure. Missing items are treated as “not recorded”, not
            as risk.
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
                key={i}
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
      <section className="space-y-4 pt-4">
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
          <FileText className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
