// src/pages/InPersonResults.tsx

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Camera,
  ClipboardList,
  FileText,
  HelpCircle,
  Scale,
} from "lucide-react";

import { loadProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";
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

function Paragraph({ value }: { value: unknown }): ReactNode {
  const t = asCleanText(value);
  if (!t) return null;
  return (
    <p className="text-[15px] leading-relaxed text-slate-300 max-w-3xl whitespace-pre-line">
      {t}
    </p>
  );
}

function BulletList({ items }: { items: string[] }): ReactNode {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function EvidenceBlock({ evidence }: { evidence: unknown }): ReactNode {
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
      if (typeof v === "string" && v.trim())
        return <Paragraph value={v} />;
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
  const [params] = useSearchParams();

  const progress: any = loadProgress();
  const scanId = params.get("scanId") || progress?.scanId || "";

  const [unlockChecked, setUnlockChecked] = useState(false);

  /* -------------------------------------------------------
     Routing safety (server-authoritative unlock check)
  ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    async function checkUnlock() {
      if (!scanId) {
        navigate("/scan/in-person/start", { replace: true });
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          navigate("/sign-in", { replace: true });
          return;
        }

        const res = await fetch("/api/check-in-person-unlock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ scanId }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data?.error === "NOT_AUTHENTICATED") {
            navigate("/sign-in", { replace: true });
            return;
          }
          throw new Error(data?.error || "CHECK_FAILED");
        }

        if (!data?.unlocked) {
          navigate(`/scan/in-person/unlock/${encodeURIComponent(scanId)}`, {
            replace: true,
          });
          return;
        }

        if (!cancelled) {
          setUnlockChecked(true);
        }
      } catch (err) {
        console.error("Unlock check failed:", err);
        if (!cancelled) {
          navigate(`/scan/in-person/unlock/${encodeURIComponent(scanId)}`, {
            replace: true,
          });
        }
      }
    }

    checkUnlock();

    return () => {
      cancelled = true;
    };
  }, [scanId, navigate]);

  if (!scanId) return null;
  if (!unlockChecked) return null;

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

      {/* EVIDENCE BASIS */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <ClipboardList className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">
            Evidence considered in this assessment
          </h2>
        </div>

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
          <div className="flex items-center gap-3 text-slate-300">
            <HelpCircle className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold">Areas you marked as unsure</h2>
          </div>

          <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-300">
            {uncertaintyFactors.map((u, i) => (
              <li key={i}>{UncertaintyText(u)}</li>
            ))}
          </ul>
        </section>
      )}

      {/* HOW RISK WAS WEIGHED */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-slate-300">
          <Scale className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold">How risk was weighed</h2>
        </div>

        <Paragraph value={(analysis as any).riskWeightingExplanation} />
      </section>

      {/* ACTIONS */}
      <section className="space-y-4 pt-4">
        <button
          onClick={() => navigate("/scan/in-person/negotiation")}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 text-base"
        >
          View buyer-safe negotiation guidance
        </button>

        <button
          onClick={() => navigate("/scan/in-person/report-print")}
          className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 flex items-center justify-center gap-2 text-sm"
        >
          <FileText className="h-4 w-4" />
          Print / save report
        </button>
      </section>
    </div>
  );
}
