import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";

export type ScanType = "online" | "in-person";

export type SavedScan = {
  id: string;
  type: ScanType;
  title: string;
  createdAt: string;
  listingUrl?: string;
  summary?: string;
};

export default function Home() {
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    try {
      const saved = loadScans();
      setScans(Array.isArray(saved) ? (saved as SavedScan[]) : []);
    } catch {
      setScans([]);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* PAGE HEADER */}
      <h1 className="text-3xl font-bold mb-2">My Scans</h1>
      <p className="text-muted-foreground mb-8">
        Start a new scan or review your previous reports.
      </p>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          to="/scan/online"
          className="rounded-xl border bg-white/5 hover:bg-white/10 transition shadow-sm p-5 flex items-center gap-4"
        >
          <div className="text-4xl">🌐</div>
          <div>
            <h2 className="font-semibold text-lg">Online Scan</h2>
            <p className="text-sm text-muted-foreground">
              Analyse a car listing URL
            </p>
          </div>
        </Link>

        <Link
          to="/scan/in-person"
          className="rounded-xl border bg-white/5 hover:bg-white/10 transition shadow-sm p-5 flex items-center gap-4"
        >
          <div className="text-4xl">🚗</div>
          <div>
            <h2 className="font-semibold text-lg">In-person Scan</h2>
            <p className="text-sm text-muted-foreground">
              Record details while inspecting on-site
            </p>
          </div>
        </Link>
      </div>

      {/* SAVED HISTORY */}
      <h2 className="text-xl font-semibold mb-3">Saved scans</h2>

      {scans.length === 0 && (
        <div className="rounded-xl border bg-white/5 p-6 text-sm text-muted-foreground">
          No scans saved yet. Start your first scan above.
        </div>
      )}

      <div className="space-y-3">
        {scans.map((scan) => (
          <Link
            key={scan.id}
            to={`/scan/${scan.id}`}
            className="block rounded-xl border bg-white/5 hover:bg-white/10 transition shadow-sm p-4"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">
                {scan.type === "online" ? "🌐" : "🚗"}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">
                  {scan.title || "Untitled scan"}
                </h3>

                <p className="text-xs text-muted-foreground">
                  {scan.type === "online"
                    ? "Online listing analysis"
                    : "In-person inspection"}
                </p>

                <p className="text-xs mt-1 text-muted-foreground">
                  {scan.createdAt
                    ? new Date(scan.createdAt).toLocaleString()
                    : "Unknown date"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
