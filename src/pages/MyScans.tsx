import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { loadProgress } from "../utils/scanProgress";

interface SavedInspection {
  id: string;
  title: string;
  createdAt: string;
  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
  };
}

export default function MyScans() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<SavedInspection[]>([]);
  const progress = loadProgress();

  useEffect(() => {
    setInspections(loadScans() ?? []);
  }, []);

  function resumeInspection() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  const sorted = useMemo(
    () =>
      [...inspections].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [inspections]
  );

  function vehicleLabel(i: SavedInspection) {
    const v = i.vehicle ?? {};
    return [v.year, v.make, v.model].filter(Boolean).join(" ") || i.title;
  }

  if (!sorted.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">My inspections</h1>
        <p className="text-slate-400 mb-6">
          You haven’t saved any inspections yet.
        </p>

        <Link
          to="/start-scan"
          className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-medium"
        >
          Start a new inspection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">My inspections</h1>

        {progress?.step && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={resumeInspection}
              className="px-3 py-2 rounded-xl bg-amber-400 text-black text-sm font-semibold"
            >
              Continue in-progress inspection
            </button>
            <span className="text-[11px] text-slate-400">
              Pick up where you left off.
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((i) => (
          <div
            key={i.id}
            className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-2"
          >
            <h3 className="text-lg font-semibold text-white">
              {vehicleLabel(i)}
            </h3>
            <p className="text-sm text-slate-400">
              {new Date(i.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
