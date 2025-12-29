import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { saveProgress, loadProgress } from "../utils/scanProgress";

interface SavedScan {
  id: string;
  type: "online" | "in-person";
  title: string;
  createdAt: string;
  isUnlocked?: boolean;
  listingUrl?: string;
  fromOnlineScan?: boolean;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
    importStatus?: string;
  };
}

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    const stored = loadScans();
    setScans(stored ?? []);
  }, []);

  const progress = loadProgress();

  function resumeScan() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  function startInPerson(scan: SavedScan) {
    saveProgress({
      type: "in-person",
      step: "/scan/in-person/start",
      startedAt: new Date().toISOString(),
      listingUrl: scan.listingUrl ?? "",
      vehicle: scan.vehicle ?? {},
      fromOnlineScan: true,
    });

    navigate("/scan/in-person/start");
  }

  const sorted = useMemo(
    () =>
      [...scans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  const onlineScans = sorted.filter((s) => s.type === "online");
  const inPersonScans = sorted.filter((s) => s.type === "in-person");

  function VehicleLabel(scan: SavedScan) {
    const v = scan.vehicle ?? {};
    const label = [v.year, v.make, v.model].filter(Boolean).join(" ");
    return label || scan.title;
  }

  function ScanCard(scan: SavedScan) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">
            {new Date(scan.createdAt).toLocaleString()}
          </span>

          <h3 className="text-lg font-semibold">{VehicleLabel(scan)}</h3>

          {scan.listingUrl && (
            <a
              href={scan.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm underline"
            >
              View listing
            </a>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/70">
              {scan.type === "online" ? "Online scan" : "In-person scan"}
            </span>

            {scan.isUnlocked && (
              <span className="px-2 py-1 rounded-lg text-xs bg-emerald-700/60">
                Unlocked report
              </span>
            )}

            {scan.fromOnlineScan && scan.type === "in-person" && (
              <span className="px-2 py-1 rounded-lg text-xs bg-purple-700/60">
                Follow-up inspection
              </span>
            )}
          </div>

          {/* CTA — only on ONLINE scans */}
          {scan.type === "online" && (
            <div className="mt-4">
              <button
                onClick={() => startInPerson(scan)}
                className="px-4 py-2 rounded-xl bg-blue-400 text-black font-semibold hover:bg-blue-300"
              >
                Start in-person inspection for this car
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">My scans</h1>
        <p className="text-slate-400 mb-6">
          You haven’t saved any scans yet.
        </p>

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
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My scans</h1>

        {progress?.step && (
          <button
            onClick={resumeScan}
            className="px-3 py-2 rounded-xl bg-amber-400 text-black text-sm font-semibold"
          >
            Resume unfinished scan
          </button>
        )}
      </div>

      {/* Online scans */}
      {!!onlineScans.length && (
        <>
          <h2 className="text-lg font-semibold mb-2">Online scans</h2>
          <div className="flex flex-col gap-3 mb-8">
            {onlineScans.map((s) => (
              <ScanCard key={s.id} {...s} />
            ))}
          </div>
        </>
      )}

      {/* In-person scans */}
      {!!inPersonScans.length && (
        <>
          <h2 className="text-lg font-semibold mb-2">
            In-person inspections
          </h2>
          <div className="flex flex-col gap-3">
            {inPersonScans.map((s) => (
              <ScanCard key={s.id} {...s} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
