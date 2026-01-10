import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { loadProgress } from "../utils/scanProgress";

interface SavedScan {
  id: string;
  type: "in-person" | string;
  title: string;
  createdAt: string;

  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
    variant?: string;
  };
}

function vehicleLabel(scan: SavedScan) {
  const v = scan.vehicle ?? {};
  const label = [v.year, v.make, v.model].filter(Boolean).join(" ");
  return label || scan.title || "Inspection";
}

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const progress = loadProgress();

  useEffect(() => {
    const all = (loadScans() ?? []) as SavedScan[];
    const inPersonOnly = all.filter((s) => s?.type === "in-person");
    setScans(inPersonOnly);
  }, []);

  function resumeScan() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  const sorted = useMemo(
    () =>
      [...scans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  if (!sorted.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-2xl font-semibold text-white">My inspections</h1>
        <p className="text-slate-400">No saved inspections yet.</p>

        <Link
          to="/start-scan"
          className="inline-block px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
        >
          Start a new inspection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">My inspections</h1>

        {progress?.step && (
          <button
            onClick={resumeScan}
            className="px-3 py-2 rounded-xl bg-amber-400 text-black text-sm font-semibold"
          >
            Resume unfinished inspection
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
              {vehicleLabel(scan)}
            </h3>

            <p className="text-sm text-slate-400">
              {new Date(scan.createdAt).toLocaleDateString()}
            </p>

            <p className="text-[11px] text-slate-500">
              Saved locally on this device.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
