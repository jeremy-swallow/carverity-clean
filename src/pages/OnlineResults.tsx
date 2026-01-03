import { useEffect, useState } from "react";
import {
  loadOnlineResults,
  type SavedResult,
} from "../utils/onlineResults";

function SectionCard({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg p-6 mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function KeyValueRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-2 py-2 border-b border-white/10 last:border-0">
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-slate-100 text-sm">
        {value || "—"}
      </div>
    </div>
  );
}

export default function OnlineResults() {
  const [result, setResult] = useState<SavedResult | null>(null);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    const stored = loadOnlineResults();
    if (!stored) return;
    setResult(stored);

    // auto-unlock in testing mode
    setShowFull(Boolean(stored.isUnlocked));
  }, []);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-xl font-semibold mb-2">
          No scan data found
        </h1>
        <p className="text-slate-400">
          Run a scan to view your CarVerity results.
        </p>
      </div>
    );
  }

  const {
    summary,
    fullSummary,
    confidenceCode,
    vehicle,
  } = result;

  const confidenceLabel =
    confidenceCode ? `${confidenceCode} — listing confidence` : "Not available";

  const confidenceBadgeColor =
    confidenceCode === "LOW"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
      : confidenceCode === "MODERATE"
      ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
      : confidenceCode === "HIGH"
      ? "bg-red-500/20 text-red-300 border-red-400/30"
      : "bg-slate-500/20 text-slate-300 border-slate-400/30";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header gradient block */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 shadow-xl backdrop-blur-xl p-6 mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">
            CarVerity online scan results
          </h1>
          <p className="text-slate-300 text-sm">
            Independent guidance based on the details in this listing.
          </p>
        </div>

        <SectionCard title="Listing confidence">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs border ${confidenceBadgeColor}`}
          >
            {confidenceLabel}
          </span>
        </SectionCard>

        <SectionCard title="Confidence assessment">
          <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">
            {summary?.split("\n")[0] || "No preview available."}
          </p>
        </SectionCard>

        <SectionCard title="CarVerity analysis — preview">
          <p className="text-slate-100 leading-relaxed mb-4 whitespace-pre-wrap">
            {summary || "Preview not available."}
          </p>

          {!showFull && (
            <div className="rounded-xl border border-white/10 bg-white/5 text-slate-400 text-sm px-4 py-3 mb-3">
              Full report content is locked
            </div>
          )}

          {!showFull && (
            <>
              <button
                onClick={() => setShowFull(true)}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium shadow-md"
              >
                Unlock full scan (testing)
              </button>
              <p className="text-slate-500 text-xs mt-2">
                In the live app this area unlocks after purchasing a scan.
              </p>
            </>
          )}

          {showFull && (
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
                {fullSummary || summary}
              </pre>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Vehicle details">
          <KeyValueRow label="Make" value={vehicle?.make} />
          <KeyValueRow label="Model" value={vehicle?.model} />
          <KeyValueRow label="Year" value={vehicle?.year} />
          <KeyValueRow label="Kilometres" value={vehicle?.kilometres?.toString()} />
        </SectionCard>
      </div>
    </div>
  );
}
