// src/pages/MyScans.tsx

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { loadProgress } from "../utils/scanProgress";
import {
  Image as ImageIcon,
  Info,
  ArrowRight,
  FileText,
  BadgeDollarSign,
  ShieldCheck,
  Clock,
  Search,
  X,
  RefreshCcw,
  Eye,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

interface SavedInspection {
  id: string;
  title: string;
  createdAt: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  thumbnail?: string | null;
}

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

function titleFromId(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function uncertaintyLabel(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (isRecord(value)) {
    return (
      asCleanText(value.label) ||
      asCleanText(value.title) ||
      asCleanText(value.reason) ||
      asCleanText(value.description) ||
      "You marked something as unsure."
    );
  }

  return "You marked something as unsure.";
}

function getLocalSnapshotForScan(scanId: string) {
  if (!scanId) return null;

  try {
    const raw = localStorage.getItem(`carverity_scan_${scanId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function pickVehicleLabel(i: SavedInspection) {
  const v = i.vehicle ?? {};
  return [v.year, v.make, v.model].filter(Boolean).join(" ") || i.title;
}

function daysAgoLabel(dateIso: string) {
  const t = new Date(dateIso).getTime();
  if (!Number.isFinite(t)) return "";

  const diffMs = Date.now() - t;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(dateIso).toLocaleDateString();
}

function SmallPill({
  icon,
  text,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  text: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
      : tone === "warn"
      ? "border-amber-400/25 bg-amber-500/10 text-amber-100"
      : "border-white/15 bg-white/5 text-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
        cls,
      ].join(" ")}
    >
      <span className="text-slate-300">{icon}</span>
      <span className="leading-none">{text}</span>
    </span>
  );
}

export default function MyScans() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<SavedInspection[]>([]);
  const progress = loadProgress();

  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"recent" | "oldest">("recent");

  useEffect(() => {
    setInspections(loadScans() ?? []);
  }, []);

  function resumeInspection() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  function refreshList() {
    setInspections(loadScans() ?? []);
  }

  const sorted = useMemo(() => {
    const base = [...inspections];

    base.sort((a, b) => {
      const aT = new Date(a.createdAt).getTime();
      const bT = new Date(b.createdAt).getTime();

      if (sortMode === "oldest") return aT - bT;
      return bT - aT;
    });

    return base;
  }, [inspections, sortMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;

    return sorted.filter((i) => {
      const label = pickVehicleLabel(i).toLowerCase();
      const title = (i.title ?? "").toLowerCase();
      return (
        label.includes(q) ||
        title.includes(q) ||
        i.id.toLowerCase().includes(q)
      );
    });
  }, [sorted, query]);

  const enhancedCards = useMemo(() => {
    return filtered.map((i) => {
      const snap = getLocalSnapshotForScan(i.id);

      const progressSnapshot = snap?.progressSnapshot ?? null;
      const analysis = snap?.analysis ?? null;

      const askingPrice =
        typeof progressSnapshot?.askingPrice === "number"
          ? progressSnapshot.askingPrice
          : null;

      const confidence = clamp(Number(analysis?.confidenceScore ?? 0), 0, 100);
      const coverage = clamp(Number(analysis?.completenessScore ?? 0), 0, 100);

      const uncertaintyCount = Array.isArray(analysis?.uncertaintyFactors)
        ? analysis.uncertaintyFactors.length
        : 0;

      const risks = Array.isArray(analysis?.risks) ? analysis.risks : [];
      const concernCount = risks.filter(
        (r: any) => r?.severity && r.severity !== "info"
      ).length;

      const verdict = typeof analysis?.verdict === "string" ? analysis.verdict : "";

      const verdictLabel =
        verdict === "proceed"
          ? "Looks OK"
          : verdict === "walk-away"
          ? "Pause"
          : verdict === "caution"
          ? "Caution"
          : "Report";

      const verdictTone =
        verdict === "proceed"
          ? "good"
          : verdict === "walk-away"
          ? "warn"
          : "neutral";

      const lastTouched = daysAgoLabel(i.createdAt);

      const stepRaw =
        typeof progressSnapshot?.step === "string" ? progressSnapshot.step : "";
      const stepLabel = stepRaw
        ? titleFromId(stepRaw.split("/").pop() || stepRaw)
        : "";

      let topUnsure = "";
      if (
        Array.isArray(analysis?.uncertaintyFactors) &&
        analysis.uncertaintyFactors.length > 0
      ) {
        topUnsure = uncertaintyLabel(analysis.uncertaintyFactors[0]);
      }

      return {
        ...i,
        meta: {
          askingPrice,
          confidence,
          coverage,
          uncertaintyCount,
          concernCount,
          verdictLabel,
          verdictTone: verdictTone as "neutral" | "good" | "warn",
          lastTouched,
          stepLabel,
          topUnsure,
          hasAnalysis: Boolean(analysis),
        },
      };
    });
  }, [filtered]);

  const hasInProgress = Boolean(progress?.step);

  if (!sorted.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            Saved inspections (this device)
          </h1>

          <p className="text-slate-400">
            You don’t have any saved inspections on this device yet.
          </p>
        </div>

        <div className="inline-flex flex-col items-center gap-3">
          <Link
            to="/start-scan"
            className="px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold inline-flex items-center gap-2"
          >
            Start a new inspection
            <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-left">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-slate-300 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                These saved inspections live in your browser on this device.
                <br />
                Signing in is for credits and purchases — it does not sync your
                saved inspections between devices yet.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/" className="text-slate-300 underline text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-7">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">
            Saved inspections (this device)
          </h1>
          <p className="text-xs text-slate-400">
            Stored in your browser — not synced between devices.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black text-sm font-semibold inline-flex items-center gap-2"
            >
              Start new
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={refreshList}
              className="px-4 py-2 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 text-sm font-semibold inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {hasInProgress && (
            <button
              onClick={resumeInspection}
              className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-sm font-semibold inline-flex items-center gap-2"
            >
              Continue in-progress inspection
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH + SORT */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by vehicle, title, or scan ID…"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 pl-10 pr-10 py-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-white/20"
              />
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortMode("recent")}
              className={[
                "px-4 py-3 rounded-2xl text-sm font-semibold border",
                sortMode === "recent"
                  ? "bg-white text-black border-white/10"
                  : "bg-slate-950/30 text-slate-200 border-white/15 hover:bg-slate-900",
              ].join(" ")}
            >
              Recent
            </button>

            <button
              type="button"
              onClick={() => setSortMode("oldest")}
              className={[
                "px-4 py-3 rounded-2xl text-sm font-semibold border",
                sortMode === "oldest"
                  ? "bg-white text-black border-white/10"
                  : "bg-slate-950/30 text-slate-200 border-white/15 hover:bg-slate-900",
              ].join(" ")}
            >
              Oldest
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-300 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Tip: If you want to keep a copy long-term, use Print / Save as PDF
            after your report is generated.
            <br />
            If you clear browser data or change devices, these saved inspections
            may disappear.
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-3">
        {enhancedCards.map((i) => {
          const label = pickVehicleLabel(i);
          const hasThumb = Boolean(i.thumbnail);

          const meta = (i as any).meta as {
            askingPrice: number | null;
            confidence: number;
            coverage: number;
            uncertaintyCount: number;
            concernCount: number;
            verdictLabel: string;
            verdictTone: "neutral" | "good" | "warn";
            lastTouched: string;
            stepLabel: string;
            topUnsure: string;
            hasAnalysis: boolean;
          };

          return (
            <div
              key={i.id}
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-slate-950/40 overflow-hidden">
                  {hasThumb ? (
                    <img
                      src={i.thumbnail as string}
                      alt={label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-[10px] text-slate-500">
                      <ImageIcon className="h-4 w-4 text-slate-600" />
                      No photo
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {label}
                    </h3>

                    <SmallPill
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      text={meta.verdictLabel}
                      tone={meta.verdictTone}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <SmallPill
                      icon={<Clock className="h-3.5 w-3.5" />}
                      text={meta.lastTouched}
                    />

                    {meta.askingPrice != null && (
                      <SmallPill
                        icon={<BadgeDollarSign className="h-3.5 w-3.5" />}
                        text={formatMoney(meta.askingPrice)}
                      />
                    )}

                    {meta.hasAnalysis && (
                      <>
                        <SmallPill
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          text={`Confidence ${meta.confidence}%`}
                        />
                        <SmallPill
                          icon={<Eye className="h-3.5 w-3.5" />}
                          text={`Coverage ${meta.coverage}%`}
                        />
                      </>
                    )}

                    {meta.concernCount > 0 && (
                      <SmallPill
                        icon={<AlertTriangle className="h-3.5 w-3.5" />}
                        text={`${meta.concernCount} concern${
                          meta.concernCount === 1 ? "" : "s"
                        }`}
                        tone="warn"
                      />
                    )}

                    {meta.uncertaintyCount > 0 && (
                      <SmallPill
                        icon={<HelpCircle className="h-3.5 w-3.5" />}
                        text={`${meta.uncertaintyCount} unsure`}
                        tone="neutral"
                      />
                    )}
                  </div>

                  {meta.stepLabel && (
                    <p className="text-xs text-slate-500">
                      Last step: {meta.stepLabel}
                    </p>
                  )}

                  {meta.topUnsure && meta.uncertaintyCount > 0 && (
                    <p className="text-xs text-slate-400 truncate">
                      Unsure: {meta.topUnsure}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/scan/in-person/results/${i.id}`)}
                    className="px-4 py-2 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 text-sm font-semibold inline-flex items-center gap-2"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/scan/in-person/price-positioning/${i.id}`)
                      }
                      className="px-3 py-2 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <BadgeDollarSign className="h-4 w-4" />
                      Price
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/scan/in-person/print/${i.id}`)}
                      className="px-3 py-2 rounded-2xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 text-xs font-semibold inline-flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="pt-4">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
