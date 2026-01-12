// src/pages/InPersonResults.tsx

import { useEffect, useMemo, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Camera,
  ClipboardList,
  ShieldCheck,
  FileText,
  HelpCircle,
  Scale,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

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

function renderTextBlock(value: unknown): ReactNode {
  const t = asCleanText(value);
  if (!t) return null;

  return (
    <p className="text-sm text-slate-400 max-w-3xl whitespace-pre-line">{t}</p>
  );
}

function renderStringList(items: string[]): ReactNode {
  return (
    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function renderEvidenceSummary(evidenceSummary: unknown): ReactNode {
  if (typeof evidenceSummary === "string") {
    return (
      <p className="text-sm text-slate-400 max-w-3xl whitespace-pre-line">
        {evidenceSummary}
      </p>
    );
  }

  if (Array.isArray(evidenceSummary)) {
    const strings = evidenceSummary.map(asCleanText).filter(Boolean);
    if (strings.length > 0) return renderStringList(strings);

    return (
      <p className="text-sm text-slate-400 max-w-3xl">
        Evidence was recorded, but could not be summarised into text.
      </p>
    );
  }

  if (isRecord(evidenceSummary)) {
    const candidateKeys = [
      "bullets",
      "bulletPoints",
      "points",
      "items",
      "highlights",
      "summary",
      "text",
      "notes",
    ];

    for (const key of candidateKeys) {
      const v = evidenceSummary[key];

      if (typeof v === "string" && v.trim()) {
        return (
          <p className="text-sm text-slate-400 max-w-3xl whitespace-pre-line">
            {v}
          </p>
        );
      }

      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return renderStringList(strings);
      }
    }

    const flattened: string[] = [];
    Object.entries(evidenceSummary).forEach(([k, v]) => {
      const t = asCleanText(v);
      if (t) flattened.push(`${k}: ${t}`);
    });

    if (flattened.length > 0) return renderStringList(flattened);

    return (
      <p className="text-sm text-slate-400 max-w-3xl">
        Evidence was recorded, but could not be summarised into text.
      </p>
    );
  }

  return (
    <p className="text-sm text-slate-400 max-w-3xl">
      Evidence was recorded, but could not be summarised into text.
    </p>
  );
}

function uncertaintyToText(u: unknown): string {
  if (typeof u === "string") return u;

  if (isRecord(u)) {
    const candidates = [
      u.label,
      u.title,
      u.name,
      u.factor,
      u.description,
      u.message,
      u.text,
      u.reason,
    ]
      .map(asCleanText)
      .filter(Boolean);

    if (candidates.length > 0) return candidates[0];

    const label = asCleanText(u.label) || asCleanText(u.title) || "";
    const reason = asCleanText(u.reason) || asCleanText(u.description) || "";

    if (label && reason) return `${label} — ${reason}`;
    if (label) return label;
    if (reason) return reason;
  }

  return "An item was marked as unsure.";
}

function rangeToText(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return `$${value.toLocaleString("en-AU")}`;

  if (Array.isArray(value)) {
    const nums = value
      .map((x) => (typeof x === "number" ? x : null))
      .filter((x): x is number => x != null);

    if (nums.length >= 2) {
      const lo = Math.min(nums[0], nums[1]);
      const hi = Math.max(nums[0], nums[1]);
      return `$${lo.toLocaleString("en-AU")}–$${hi.toLocaleString("en-AU")}`;
    }
  }

  if (isRecord(value)) {
    const min =
      (typeof value.min === "number" && value.min) ||
      (typeof value.low === "number" && value.low) ||
      (typeof value.from === "number" && value.from) ||
      null;

    const max =
      (typeof value.max === "number" && value.max) ||
      (typeof value.high === "number" && value.high) ||
      (typeof value.to === "number" && value.to) ||
      null;

    const label = asCleanText(value.label) || asCleanText(value.range) || "";

    if (min != null && max != null) {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      const numeric = `$${lo.toLocaleString("en-AU")}–$${hi.toLocaleString(
        "en-AU"
      )}`;
      return label ? `${label} (${numeric})` : numeric;
    }

    const text =
      asCleanText(value.text) ||
      asCleanText(value.summary) ||
      asCleanText(value.display) ||
      "";

    if (text) return text;
  }

  return "";
}

function pickNegotiationSummary(np: unknown): string {
  if (!isRecord(np)) return "";
  const candidates = [
    np.summary,
    np.positioningSummary,
    np.buyerSummary,
    np.message,
    np.text,
    np.notes,
  ]
    .map(asCleanText)
    .filter(Boolean);

  if (candidates.length > 0) return candidates[0];
  return "";
}

function extractNegotiationRanges(np: unknown): {
  conservativeLabel: string;
  conservativeValue: string;
  assertiveLabel: string;
  assertiveValue: string;
} {
  const fallback = {
    conservativeLabel: "Conservative adjustment",
    conservativeValue: "",
    assertiveLabel: "Assertive adjustment",
    assertiveValue: "",
  };

  if (!isRecord(np)) return fallback;

  const conservativeValue = rangeToText(np.conservative);

  const assertiveCandidate =
    np.assertive ?? np.aggressive ?? np.strong ?? np.firm ?? np.upper;

  const assertiveValue = rangeToText(assertiveCandidate);

  return {
    conservativeLabel: "Conservative adjustment",
    conservativeValue,
    assertiveLabel: "Assertive adjustment",
    assertiveValue,
  };
}

export default function InPersonResults() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const progress: any = loadProgress();
  const scanId = params.get("scanId") || progress?.scanId || "";

  /* -------------------------------------------------------
     Routing safety
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    if (!isScanUnlocked(scanId)) {
      navigate(
        `/scan/in-person/preview?scanId=${encodeURIComponent(scanId)}`,
        { replace: true }
      );
    }
  }, [scanId, navigate]);

  if (!scanId || !isScanUnlocked(scanId)) return null;

  /* -------------------------------------------------------
     Analysis
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    return analyseInPersonInspection(progress);
  }, [progress]);

  const photos: string[] = (progress?.photos ?? []).map((p: any) => p.dataUrl);

  /* -------------------------------------------------------
     Verdict meta
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: "Proceed with confidence",
      tone: "border-emerald-500/40 bg-emerald-500/10",
    },
    caution: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Proceed — with targeted clarification",
      tone: "border-amber-500/40 bg-amber-500/10",
    },
    "walk-away": {
      icon: <XCircle className="h-6 w-6 text-red-400" />,
      title: "Risk appears elevated — walking away is reasonable",
      tone: "border-red-500/40 bg-red-500/10",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Risk groupings
  ------------------------------------------------------- */
  const criticalRisks = analysis.risks.filter((r) => r.severity === "critical");
  const moderateRisks = analysis.risks.filter((r) => r.severity === "moderate");

  const negotiationSummary = pickNegotiationSummary(
    (analysis as any).negotiationPositioning
  );

  const negotiationRanges = extractNegotiationRanges(
    (analysis as any).negotiationPositioning
  );

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-14 space-y-16">
      {/* =====================================================
          01 — REPORT HEADER
      ===================================================== */}
      <section className="space-y-3">
        <span className="text-[11px] uppercase tracking-widest text-slate-400">
          CarVerity buyer-side inspection report
        </span>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
          <span>Scan ID: {scanId}</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>
      </section>

      {/* =====================================================
          02 — EXECUTIVE VERDICT
      ===================================================== */}
      <section
        className={`rounded-2xl border px-6 py-6 space-y-5 ${verdictMeta.tone}`}
      >
        <div className="flex items-start gap-3">
          {verdictMeta.icon}
          <div>
            <h1 className="text-2xl font-semibold text-white">
              {verdictMeta.title}
            </h1>
            <div className="mt-2">
              {renderTextBlock((analysis as any).whyThisVerdict) || (
                <p className="text-sm text-slate-300 max-w-2xl">
                  {(analysis as any).verdictReason}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4">
          <div>
            <div className="flex items-center gap-2 text-slate-300">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">
                Confidence in assessment
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-300">
              <Eye className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Inspection coverage</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          03 — WHAT EVIDENCE THIS IS BASED ON
      ===================================================== */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-slate-300">
          <ClipboardList className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">
            Evidence considered in this assessment
          </h2>
        </div>

        {renderEvidenceSummary((analysis as any).evidenceSummary)}

        <p className="text-xs text-slate-400 max-w-3xl">
          This report only uses what you recorded and what you explicitly marked
          as unsure. Missing items are treated as “not recorded”, not as risk.
        </p>
      </section>

      {/* =====================================================
          04 — PHOTO EVIDENCE
      ===================================================== */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 text-slate-300">
          <Camera className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">Photo evidence captured</h2>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

      {/* =====================================================
          05 — KEY RISKS IDENTIFIED
      ===================================================== */}
      {criticalRisks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">
              High-impact items identified
            </h2>
          </div>

          {criticalRisks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/60 px-5 py-4 space-y-1"
            >
              <p className="text-sm font-semibold text-white">{r.label}</p>
              <p className="text-sm text-slate-400">{r.explanation}</p>
            </div>
          ))}
        </section>
      )}

      {/* =====================================================
          06 — ITEMS WORTH CLARIFYING
      ===================================================== */}
      {moderateRisks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold">
              Items worth clarifying before proceeding
            </h2>
          </div>

          {moderateRisks.map((r) => (
            <div key={r.id} className="rounded-xl bg-slate-900/60 px-5 py-4">
              <p className="text-sm font-medium text-slate-200">{r.label}</p>
              <p className="mt-1 text-sm text-slate-400">{r.explanation}</p>
            </div>
          ))}
        </section>
      )}

      {/* =====================================================
          07 — DECLARED UNCERTAINTY
      ===================================================== */}
      {uncertaintyFactors.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold">Areas you marked as unsure</h2>
          </div>

          <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
            {uncertaintyFactors.map((u, i) => (
              <li key={i}>{uncertaintyToText(u)}</li>
            ))}
          </ul>

          <p className="text-xs text-slate-400 max-w-3xl">
            These are the only sources of uncertainty in this report — they come
            directly from what you marked as unsure.
          </p>
        </section>
      )}

      {/* =====================================================
          08 — HOW RISK WAS WEIGHED
      ===================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <Scale className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold">How risk was weighed</h2>
        </div>

        {renderTextBlock((analysis as any).riskWeightingExplanation) || (
          <p className="text-sm text-slate-400 max-w-3xl">
            Risk weighting is based on the severity of recorded findings and any
            buyer-marked uncertainty.
          </p>
        )}
      </section>

      {/* =====================================================
          09 — NEGOTIATION POSITION
      ===================================================== */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">
          Buyer positioning based on this inspection
        </h2>

        {negotiationSummary ? (
          <p className="text-sm text-slate-400 max-w-3xl whitespace-pre-line">
            {negotiationSummary}
          </p>
        ) : (
          <p className="text-sm text-slate-400 max-w-3xl">
            This positioning is calculated from your recorded evidence and any
            items you marked as unsure.
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          {negotiationRanges.conservativeValue ? (
            <span>
              {negotiationRanges.conservativeLabel}:{" "}
              <strong>{negotiationRanges.conservativeValue}</strong>
            </span>
          ) : null}

          {negotiationRanges.assertiveValue ? (
            <span>
              {negotiationRanges.assertiveLabel}:{" "}
              <strong>{negotiationRanges.assertiveValue}</strong>
            </span>
          ) : null}
        </div>
      </section>

      {/* =====================================================
          10 — ACTIONS
      ===================================================== */}
      <section className="space-y-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4"
        >
          View buyer-safe negotiation guidance
        </button>

        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
