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
  thumbnail?: string | null;
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
        {sorted.map((i) => {
          const label = vehicleLabel(i);
          const date = new Date(i.createdAt).toLocaleDateString();
          const hasThumb = Boolean(i.thumbnail);

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
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-500">
                      No photo
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {label}
                  </h3>
                  <p className="text-sm text-slate-400">{date}</p>
                </div>

                {/* Open */}
                <button
                  type="button"
                  onClick={() => navigate(`/scan/in-person/results/${i.id}`)}
                  className="px-3 py-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 text-sm"
                >
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
