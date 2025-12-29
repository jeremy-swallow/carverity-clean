import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { saveProgress } from "../utils/scanProgress";

interface SavedScan {
  id: string;
  type: "online" | "in-person";
  title: string;
  createdAt: string;
  listingUrl?: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    variant?: string;
    importStatus?: string;
  };
  fromOnlineScan?: boolean;
}

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    const stored = loadScans();
    setScans(stored ?? []);
  }, []);

  function startInPersonFromOnline(scan: SavedScan) {
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

  if (!scans.length) {
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
      <h1 className="text-2xl font-semibold mb-6">My scans</h1>

      <div className="flex flex-col gap-4">
        {scans.map((scan) => {
          const vehicleLabel = [
            scan?.vehicle?.year,
            scan?.vehicle?.make,
            scan?.vehicle?.model,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={scan.id}
              className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">
                  {new Date(scan.createdAt).toLocaleString()}
                </span>

                <h2 className="text-lg font-semibold">
                  {vehicleLabel || scan.title}
                </h2>

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

                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/70">
                    {scan.type === "online"
                      ? "Online scan"
                      : "In-person scan"}
                  </span>

                  {scan.fromOnlineScan && scan.type === "in-person" && (
                    <span className="px-2 py-1 rounded-lg text-xs bg-emerald-700/60">
                      Follow-up inspection
                    </span>
                  )}
                </div>

                {/* CTA — only for online scans */}
                {scan.type === "online" && (
                  <div className="mt-4">
                    <button
                      onClick={() => startInPersonFromOnline(scan)}
                      className="px-4 py-2 rounded-xl bg-blue-400 text-black font-semibold hover:bg-blue-300"
                    >
                      Start in-person inspection for this car
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
