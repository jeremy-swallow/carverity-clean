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
  ClipboardCheck,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  RotateCcw,
  Printer,
  Flag,
  Wrench,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { loadScanById } from "../utils/scanStorage";

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

function extractEvidenceBullets(evidence: unknown): string[] {
  if (!evidence) return [];

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
      "You marked something as unsure."
    );
  }
  return "You marked something as unsure.";
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

function vehicleTitleFromProgress(p: any): string {
  const year = p?.vehicleYear ?? p?.vehicle?.year ?? "";
  const make = p?.vehicleMake ?? p?.vehicle?.make ?? "";
  const model = p?.vehicleModel ?? p?.vehicle?.model ?? "";
  const parts = [year, make, model].filter(Boolean);
  return parts.length ? parts.join(" ") : "";
}

function severityLabel(sev: unknown): "Minor" | "Moderate" | "Major" {
  if (sev === "major") return "Major";
  if (sev === "moderate") return "Moderate";
  return "Minor";
}

function severityPillClass(sev: unknown) {
  if (sev === "major") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  if (sev === "moderate") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
  return "border-white/15 bg-white/5 text-slate-200";
}

function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* =======================================================
   Page
======================================================= */
export default function InPersonResults() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

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
     Load saved scan (preferred)
  ------------------------------------------------------- */
  const saved = useMemo(() => loadScanById(scanId), [scanId]);

  const progressFallback: any = loadProgress();
  const progress: any = saved?.progressSnapshot ?? progressFallback ?? {};

  /* -------------------------------------------------------
     Analysis (prefer persisted analysis)
  ------------------------------------------------------- */
  const analysis = useMemo(() => {
    if (saved?.analysis) return saved.analysis;
    return analyseInPersonInspection(progress);
  }, [saved, progress]);

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
  const evidenceBullets = extractEvidenceBullets(evidenceSummary);

  const askingPrice =
    typeof progress?.askingPrice === "number" ? progress.askingPrice : null;

  const confidence = clamp(Number(analysis.confidenceScore ?? 0), 0, 100);
  const coverage = clamp(Number(analysis.completenessScore ?? 0), 0, 100);

  /* -------------------------------------------------------
     Explicit evidence lists (the missing part)
  ------------------------------------------------------- */
  const flaggedChecks = useMemo(() => {
    const checks = progress?.checks ?? {};
    if (!checks || typeof checks !== "object") return [];

    const items = Object.entries(checks)
      .map(([id, v]: any) => {
        const value = v?.value as string | undefined;
        const note = (v?.note ?? "").trim();

        if (value !== "concern" && value !== "unsure") return null;

        const label = titleFromId(id);
        return {
          id,
          label,
          value,
          note,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      label: string;
      value: "concern" | "unsure";
      note: string;
    }>;

    // concerns first, then unsure
    items.sort((a, b) => {
      const rank = (x: "concern" | "unsure") => (x === "concern" ? 0 : 1);
      return rank(a.value) - rank(b.value);
    });

    return items;
  }, [progress]);

  const recordedImperfections = useMemo(() => {
    const list = Array.isArray(progress?.imperfections)
      ? progress.imperfections
      : [];

    const cleaned = list
      .map((imp: any) => {
        const id = String(imp?.id ?? "");
        const label = (imp?.label ?? "").trim();
        const location = (imp?.location ?? "").trim();
        const note = (imp?.note ?? "").trim();
        const severity = imp?.severity ?? "minor";

        if (!id && !label && !location && !note) return null;

        return {
          id: id || `${severity}-${label}-${location}-${note}`.slice(0, 60),
          label: label || "Imperfection",
          location,
          note,
          severity,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      label: string;
      location: string;
      note: string;
      severity: "minor" | "moderate" | "major";
    }>;

    const weight = (sev: string) =>
      sev === "major" ? 0 : sev === "moderate" ? 1 : 2;

    cleaned.sort((a, b) => weight(a.severity) - weight(b.severity));

    return cleaned;
  }, [progress]);

  /* -------------------------------------------------------
     Verdict meta (simpler language)
  ------------------------------------------------------- */
  const verdictMeta = {
    proceed: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      title: "Looks OK to continue",
      tone: "border-emerald-500/40 bg-emerald-500/10",
      posture:
        "Based on what you recorded, there are no major red flags. Still do the normal checks before you buy.",
      short: "Looks OK to continue",
    },
    caution: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-400" />,
      title: "Continue only after a few checks",
      tone: "border-amber-500/40 bg-amber-500/10",
      posture:
        "You recorded at least one concern or unsure item. Get clear answers before you commit.",
      short: "Check a few things first",
    },
    "walk-away": {
      icon: <XCircle className="h-6 w-6 text-red-400" />,
      title: "Pause — walking away is reasonable",
      tone: "border-red-500/40 bg-red-500/10",
      posture:
        "What you recorded suggests higher risk. If the seller can’t explain or prove key items, it’s OK to walk away.",
      short: "Pause / walk away",
    },
  }[analysis.verdict];

  /* -------------------------------------------------------
     Next steps (simpler, human language)
  ------------------------------------------------------- */
  const nextSteps = useMemo(() => {
    const steps: string[] = [];

    steps.push(
      "Take a short test drive if possible. If you’re planning to buy the car, this is strongly recommended."
    );

    if (criticalRisks.length > 0) {
      steps.push(
        "Start with the biggest concerns first. Ask for proof (invoice, photos, written confirmation)."
      );
    }

    if (moderateRisks.length > 0) {
      steps.push(
        "Ask the seller to explain the concerns you recorded. Don’t guess — confirm."
      );
    }

    if (uncertaintyFactors.length > 0) {
      steps.push(
        "Anything marked “unsure” should be treated as unknown. Try to verify it before buying."
      );
    }

    steps.push(
      "Do the basics: match paperwork to the car, check service history, and watch for warning lights."
    );

    return steps.slice(0, 5);
  }, [criticalRisks.length, moderateRisks.length, uncertaintyFactors.length]);

  const clarifyQuestions = useMemo(() => {
    const qs: string[] = [];

    for (const r of [...criticalRisks, ...moderateRisks]) {
      const label = (r.label || "").trim();
      if (!label) continue;

      qs.push(
        `Can you show proof for “${label}” (invoice, inspection note, photos, or written confirmation)?`
      );
    }

    if (qs.length === 0 && uncertaintyFactors.length > 0) {
      qs.push(
        "Can you confirm the things I couldn’t check today (service history, repairs, warnings, faults) in writing?"
      );
    }

    if (qs.length === 0) {
      qs.push("Can you show the latest service invoice and any repair history?");
      qs.push("Are there any known faults or warning lights?");
    }

    return qs.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const whyThisVerdict =
    (analysis as any).whyThisVerdict || (analysis as any).verdictReason || "";

  const topSignals = useMemo(() => {
    const signals: Array<{
      label: string;
      tone: "critical" | "moderate" | "unknown";
    }> = [];

    for (const r of criticalRisks.slice(0, 2)) {
      signals.push({ label: r.label, tone: "critical" });
    }
    for (const r of moderateRisks.slice(0, 2)) {
      signals.push({ label: r.label, tone: "moderate" });
    }

    if (signals.length < 3 && uncertaintyFactors.length > 0) {
      signals.push({
        label: "Some items were marked as unsure",
        tone: "unknown",
      });
    }

    return signals.slice(0, 4);
  }, [criticalRisks, moderateRisks, uncertaintyFactors.length]);

  const scoreBlurb = useMemo(() => {
    if (coverage < 40) {
      return "You didn’t record much, so this result is cautious. It can still help — but check more before you decide.";
    }
    if (confidence < 45) {
      return "Some things need checking. Use the questions below to get clearer answers.";
    }
    return "This is based only on what you recorded. It doesn’t assume anything you didn’t check.";
  }, [coverage, confidence]);

  /* -------------------------------------------------------
     Professional evidence copy
  ------------------------------------------------------- */
  const evidenceHeadline = useMemo(() => {
    const concernCount = analysis.risks.filter((r) => r.severity !== "info").length;
    const imperfectionCount = recordedImperfections.length;
    const photoCount = photos.length;

    const parts: string[] = [];

    if (concernCount > 0) parts.push(`${concernCount} flagged item${concernCount === 1 ? "" : "s"}`);
    if (imperfectionCount > 0)
      parts.push(`${imperfectionCount} imperfection${imperfectionCount === 1 ? "" : "s"}`);
    if (photoCount > 0) parts.push(`${photoCount} photo${photoCount === 1 ? "" : "s"}`);

    if (parts.length === 0) {
      return "This report is based on the information recorded during your inspection.";
    }

    return `This report was generated from ${parts.join(", ")} recorded during your inspection.`;
  }, [analysis.risks, recordedImperfections.length, photos.length]);

  const evidenceNotes = useMemo(() => {
    const lines: string[] = [];

    lines.push(
      "Only items you recorded are used. If something wasn’t checked, it’s treated as not recorded — not as good or bad."
    );

    if (uncertaintyFactors.length > 0) {
      lines.push(
        "Items marked as unsure are treated as unknown and included in the overall risk posture."
      );
    }

    lines.push(
      "This is not a mechanical certification. If you’re close to buying, consider an independent pre-purchase inspection."
    );

    return lines;
  }, [uncertaintyFactors.length]);

  /* -------------------------------------------------------
     Email report (opens user's own email client)
  ------------------------------------------------------- */
  const emailHref = useMemo(() => {
    const subjectParts = ["CarVerity report", vehicleTitleFromProgress(progress)];
    const subject = subjectParts.filter(Boolean).join(" — ");

    const lines: string[] = [];
    lines.push("Hi,");
    lines.push("");
    lines.push("Here is my CarVerity in-person inspection summary.");
    lines.push("");
    lines.push(`Vehicle: ${vehicleTitleFromProgress(progress) || "—"}`);
    lines.push(`Scan ID: ${scanId}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Asking price: ${formatMoney(askingPrice)}`);
    lines.push("");
    lines.push("Summary:");
    lines.push(`• Result: ${verdictMeta.short}`);
    lines.push(`• Confidence: ${confidence}%`);
    lines.push(`• Coverage: ${coverage}%`);
    lines.push(
      `• Concerns recorded: ${
        analysis.risks.filter((r) => r.severity !== "info").length
      }`
    );
    lines.push(`• Unsure items: ${uncertaintyFactors.length}`);
    lines.push("");
    lines.push("Tip: You can print/save the PDF and attach it to this email.");
    lines.push("");
    lines.push("— Sent from CarVerity");

    const body = lines.join("\n");
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  }, [
    progress,
    scanId,
    askingPrice,
    verdictMeta.short,
    confidence,
    coverage,
    analysis.risks,
    uncertaintyFactors.length,
  ]);

  function startNewScan() {
    navigate("/scan/in-person/start");
  }

  /* =======================================================
     UI
  ======================================================= */
  return (
    <div className="max-w-5xl mx-auto px-6 py-16 space-y-14">
      {/* HEADER */}
      <header className="space-y-4">
        <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          CarVerity · Your report
        </span>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-400">
          <span>Scan ID: {scanId}</span>
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span>Asking price: {formatMoney(askingPrice)}</span>
        </div>
      </header>

      {/* VERDICT */}
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

            <Paragraph value={whyThisVerdict} />
          </div>
        </div>

        {/* KEY SIGNALS */}
        {topSignals.length > 0 && (
          <div className="rounded-2xl border border-white/12 bg-slate-950/30 px-5 py-4">
            <div className="flex items-center gap-2 text-slate-200">
              <ShieldCheck className="h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold">
                What stood out (from your inspection)
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {topSignals.map((s, i) => {
                const pill =
                  s.tone === "critical"
                    ? "border-red-400/30 bg-red-500/10 text-red-200"
                    : s.tone === "moderate"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-white/15 bg-white/5 text-slate-200";

                return (
                  <span
                    key={i}
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      pill,
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* SCORES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Confidence</span>
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
            <p className="mt-1 text-2xl font-semibold text-white">{coverage}%</p>
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

        <p className="text-xs text-slate-400">{scoreBlurb}</p>
      </section>

      {/* WHAT YOU FLAGGED (EXPLICIT LIST) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Flag className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">What you flagged</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-6">
          {/* Checks */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Checks (concerns + unsure)
            </div>

            {flaggedChecks.length > 0 ? (
              <div className="space-y-3">
                {flaggedChecks.map((c) => {
                  const tone =
                    c.value === "concern"
                      ? "border-red-400/25 bg-red-500/10"
                      : "border-amber-400/25 bg-amber-500/10";

                  const tag =
                    c.value === "concern" ? "Stood out" : "Couldn’t confirm";

                  return (
                    <div
                      key={c.id}
                      className={`rounded-2xl border px-5 py-4 ${tone}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-white">
                            {c.label}
                          </p>
                          {c.note ? (
                            <p className="mt-2 text-[15px] text-slate-200 leading-relaxed">
                              {c.note}
                            </p>
                          ) : (
                            <p className="mt-2 text-[14px] text-slate-300">
                              No notes added.
                            </p>
                          )}
                        </div>

                        <span className="shrink-0 inline-flex items-center rounded-full border border-white/15 bg-slate-950/30 px-3 py-1 text-xs text-slate-200">
                          {tag}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                You didn’t flag any check items as “stood out” or “unsure”.
              </p>
            )}
          </div>

          {/* Imperfections */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Imperfections
            </div>

            {recordedImperfections.length > 0 ? (
              <div className="space-y-3">
                {recordedImperfections.map((imp) => (
                  <div
                    key={imp.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white">
                          {imp.label}
                        </p>

                        <div className="mt-1 text-sm text-slate-400">
                          {imp.location ? `Location: ${imp.location}` : "Location: —"}
                        </div>

                        {imp.note ? (
                          <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                            {imp.note}
                          </p>
                        ) : (
                          <p className="mt-2 text-[14px] text-slate-400">
                            No notes added.
                          </p>
                        )}
                      </div>

                      <span
                        className={[
                          "shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          severityPillClass(imp.severity),
                        ].join(" ")}
                      >
                        {severityLabel(imp.severity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No imperfections were recorded.
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 max-w-3xl">
            This section is the exact list of what you recorded — nothing is inferred.
          </p>
        </div>
      </section>

      {/* WHAT TO DO NEXT */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <ClipboardCheck className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">What to do next</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400">
            This guidance is based only on what you recorded today.
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

      {/* QUESTIONS TO ASK */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-200">
          Questions to ask the seller
        </h2>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-4">
          <p className="text-sm text-slate-400">
            Keep it simple. You’re just trying to get clear answers.
          </p>

          <BulletList items={clarifyQuestions} />
        </div>
      </section>

      {/* BIG CONCERNS */}
      {criticalRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Biggest concerns
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

      {/* OTHER ITEMS */}
      {moderateRisks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Things worth checking
          </h2>

          <div className="space-y-4">
            {moderateRisks.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-6 py-5"
              >
                <p className="text-base font-medium text-slate-100">{r.label}</p>
                <p className="mt-2 text-[15px] text-slate-300 leading-relaxed">
                  {r.explanation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UNSURE */}
      {uncertaintyFactors.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-200">
            Things you weren’t sure about
          </h2>

          <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6">
            <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
              {uncertaintyFactors.map((u, i) => (
                <li key={i}>{UncertaintyText(u)}</li>
              ))}
            </ul>

            <p className="text-xs text-slate-500 mt-4">
              “Unsure” just means you couldn’t confirm it today. If it matters,
              try to verify it before buying.
            </p>
          </div>
        </section>
      )}

      {/* EVIDENCE CONSIDERED (PROFESSIONAL COPY) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Wrench className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Evidence considered</h2>
        </div>

        <div className="rounded-2xl border border-white/12 bg-slate-900/50 px-6 py-6 space-y-5">
          <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl">
            {evidenceHeadline}
          </p>

          {evidenceText ? (
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Summary
              </div>
              <div className="mt-2">
                <Paragraph value={evidenceText} />
              </div>
            </div>
          ) : null}

          {evidenceBullets.length > 0 && (
            <div className="pt-1">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-2">
                Recorded notes
              </div>
              <BulletList items={evidenceBullets} />
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Inspection snapshot
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-300">
              <div>
                <div className="text-slate-500 text-xs">Photos</div>
                <div className="text-white font-semibold">{photos.length}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Flagged items</div>
                <div className="text-white font-semibold">
                  {analysis.risks.filter((r) => r.severity !== "info").length}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Unsure</div>
                <div className="text-white font-semibold">
                  {uncertaintyFactors.length}
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Coverage</div>
                <div className="text-white font-semibold">{coverage}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Notes on interpretation
            </div>
            <div className="mt-2">
              <BulletList items={evidenceNotes} />
            </div>
          </div>
        </div>
      </section>

      {/* PHOTOS */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Camera className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">Photos</h2>
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
            You didn’t take any photos during this inspection.
          </p>
        )}
      </section>

      {/* FINISH */}
      <section className="space-y-5 pt-2">
        <div className="rounded-2xl border border-white/12 bg-slate-900/60 px-6 py-6">
          <p className="text-base font-semibold text-white">
            Finished — save or share this report
          </p>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-3xl">
            If you want to share this with someone (partner, family, mechanic),
            the easiest way is to save it as a PDF, then email it from your own
            email app.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/scan/in-person/print")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 hover:bg-white text-black font-semibold px-4 py-3 text-sm"
            >
              <Printer className="h-4 w-4" />
              Print / Save as PDF
            </button>

            <a
              href={emailHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 px-4 py-3 text-sm text-slate-200"
            >
              <Mail className="h-4 w-4" />
              Email this report
            </a>

            <button
              onClick={startNewScan}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Start a new scan
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Quick how-to
            </p>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              1) Tap <strong>Print / Save as PDF</strong>
              <br />
              2) Save the PDF
              <br />
              3) Tap <strong>Email this report</strong> and attach the PDF
              (optional)
            </p>
          </div>
        </div>
      </section>

      {/* PRIMARY BUTTONS */}
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

        <button
          onClick={startNewScan}
          className="w-full rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          Start a new scan
        </button>
      </section>
    </div>
  );
}
