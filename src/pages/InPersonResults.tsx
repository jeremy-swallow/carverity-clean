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
  DollarSign,
  TrendingDown,
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

function formatAud(n: number) {
  try {
    return n.toLocaleString("en-AU");
  } catch {
    return String(n);
  }
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

function EvidenceBlock({ evidence }: { evidence: unknown }) {
  if (typeof evidence === "string") return <Paragraph value={evidence} />;

  if (Array.isArray(evidence)) {
    const strings = evidence.map(asCleanText).filter(Boolean);
    return <BulletList items={strings} />;
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
      if (typeof v === "string" && v.trim()) return <Paragraph value={v} />;
      if (Array.isArray(v)) {
        const strings = v.map(asCleanText).filter(Boolean);
        if (strings.length > 0) return <BulletList items={strings} />;
      }
    }
  }

  return (
    <p className="text-[14px] text-slate-400">
      Evidence was recorded but could not be summarised into text.
    </p>
  );
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

  const criticalRisks = analysis.risks.filter((r) => r.severity === "critical");
  const moderateRisks = analysis.risks.filter((r) => r.severity === "moderate");

  const uncertaintyFactors: unknown[] = Array.isArray(
    (analysis as any).uncertaintyFactors
  )
    ? ((analysis as any).uncertaintyFactors as unknown[])
    : [];

  const pg = analysis.priceGuidance;
  const asking = pg?.askingPriceAud ?? null;
  const low = pg?.adjustedPriceLowAud ?? null;
  const high = pg?.adjustedPriceHighAud ?? null;
  const redLow = pg?.suggestedReductionLowAud ?? null;
  const redHigh = pg?.suggestedReductionHighAud ?? null;

  const hasPriceGuidance =
    typeof asking === "number" &&
    typeof low === "number" &&
    typeof high === "number" &&
    typeof redLow === "number" &&
    typeof redHigh === "number";

  const reductionMin =
    typeof redLow === "number" && typeof redHigh === "number"
      ? Math.min(redLow, redHigh)
      : null;

  const reductionMax =
    typeof redLow === "number" && typeof redHigh === "number"
      ? Math.max(redLow, redHigh)
      : null;

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">
      {/* HEADER */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Buyer Inspection Report
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
              {analysis.confidenceScore}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <Eye className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Coverage</span>
            </div>
            <p className="mt-1 text-2xl font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>
      </section>

      {/* PRICE GUIDANCE (NEW) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <DollarSign className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Price guidance (buyer-safe)</h2>
        </div>

        {hasPriceGuidance ? (
          <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Asking price
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(asking)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-emerald-200">
                  Buyer-safe adjusted range
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(low)} – ${formatAud(high)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Suggested reduction
                </p>
                <p className="text-lg font-semibold text-white">
                  ${formatAud(reductionMin ?? 0)} – ${formatAud(reductionMax ?? 0)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  (depends how firm you want to be)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-4">
              <div className="flex items-center gap-2 text-slate-200">
                <TrendingDown className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold">Why this range?</p>
              </div>

              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {(pg?.rationale ?? []).map((r, i) => (
                  <li key={i} className="leading-relaxed">
                    • {r}
                  </li>
                ))}
              </ul>

              <p className="text-xs text-slate-500 mt-3">
                {pg?.disclaimer ?? ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-6 py-5 space-y-3">
            <p className="text-sm text-amber-200 font-semibold">
              Asking price not provided
            </p>
            <p className="text-sm text-slate-300">
              Add the advertised price to generate a buyer-safe adjusted range
              based on your recorded findings.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/scan/in-person/summary")}
                className="rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold px-4 py-2 text-sm"
              >
                Add asking price
              </button>

              <button
                onClick={() => navigate("/scan/in-person/negotiation")}
                className="rounded-xl border border-white/20 text-slate-200 px-4 py-2 text-sm"
              >
                Continue without price guidance
              </button>
            </div>
          </div>
        )}
      </section>

      {/* EVIDENCE BASIS */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-200">
          Evidence considered in this assessment
        </h2>

        <EvidenceBlock evidence={(analysis as any).evidenceSummary} />

        <p className="text-xs text-slate-400 max-w-3xl">
          This assessment only uses what you recorded and what you explicitly
          marked as unsure. Missing items are treated as not recorded, not as
          risk.
        </p>
      </section>

      {/* PHOTO EVIDENCE */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Camera className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Photo evidence</h2>
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

      {/* PRIORITY FINDINGS */}
      {criticalRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            High-impact items identified
          </h2>

          <div className="space-y-4">
            {criticalRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-slate-900/60 px-6 py-5"
              >
                <p className="text-base font-semibold text-white">{r.label}</p>
                <p className="mt-1 text-[15px] text-slate-300">
                  {r.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ITEMS WORTH CLARIFYING */}
      {moderateRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Items worth clarifying
          </h2>

          <div className="space-y-4">
            {moderateRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-slate-900/50 px-6 py-5"
              >
                <p className="text-base font-medium text-slate-100">
                  {r.label}
                </p>
                <p className="mt-1 text-[15px] text-slate-300">
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
            Areas you marked as unsure
          </h2>

          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {uncertaintyFactors.map((u, i) => (
              <li key={i}>{UncertaintyText(u)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ACTIONS */}
      <section className="space-y-4 pt-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 text-base"
        >
          View negotiation guidance
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
