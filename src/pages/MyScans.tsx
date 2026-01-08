// src/pages/MyScans.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { loadProgress } from "../utils/scanProgress";

interface PricingInsight {
  confidence: string;
  advice: string;
}

interface SavedScan {
  id: string;
  type: "online" | "in-person";
  title: string;
  createdAt: string;
  listingUrl?: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
  data?: {
    pricingInsight?: PricingInsight;
  };
}

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const progress = loadProgress();

  useEffect(() => {
    setScans(loadScans() ?? []);
  }, []);

  const sorted = useMemo(
    () =>
      [...scans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  function resumeScan() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  if (!sorted.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">My scans</h1>
        <p className="text-slate-400 mb-6">No saved scans yet.</p>
        <Link
          to="/start-scan"
          className="px-4 py-2 rounded-xl bg-blue-400 text-black font-medium"
        >
          Start a new scan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">My scans</h1>
        {progress?.step && (
          <button
            onClick={resumeScan}
            className="px-3 py-2 rounded-xl bg-amber-400 text-black text-sm font-semibold"
          >
            Resume unfinished scan
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((scan) => (
          <div
            key={scan.id}
            className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-2"
          >
            <h3 className="text-lg font-semibold text-white">
              {scan.vehicle?.year} {scan.vehicle?.make} {scan.vehicle?.model}
            </h3>

            {scan.data?.pricingInsight && (
              <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/25 px-3 py-2">
                <p className="text-sm font-semibold text-emerald-200">
                  {scan.data.pricingInsight.confidence}
                </p>
                <p className="text-xs text-slate-300">
                  {scan.data.pricingInsight.advice}
                </p>
              </div>
            )}

            <p className="text-sm text-slate-400">
              {new Date(scan.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
