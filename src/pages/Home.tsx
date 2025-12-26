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
      setScans(Array.isArray(saved) ? saved : []);
    } catch {
      setScans([]);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Scans</h1>

      {/* ===== ACTION BUTTONS ===== */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/scan/online"
          className="p-4 rounded-xl border shadow-sm bg-white flex flex-col justify-center items-center"
        >
          <span className="text-3xl mb-2">🌐</span>
          <span className="font-semibold">Online Scan</span>
          <span className="text-xs text-muted-foreground text-center">
            Analyse a car listing
          </span>
        </Link>

        <Link
          to="/scan/in-person"
          className="p-4 rounded-xl border shadow-sm bg-white flex flex-col justify-center items-center"
        >
          <span className="text-3xl mb-2">🚗</span>
          <span className="font-semibold">In-person Scan</span>
          <span className="text-xs text-muted-foreground text-center">
            On-site inspection
          </span>
        </Link>
      </div>

      {/* ===== SAVED SCANS LIST (MOBILE CARD STYLE) ===== */}
      <div className="space-y-3">
        {scans.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No scans saved yet. Start a scan above.
          </p>
        )}

        {scans.map((scan) => (
          <Link
            key={scan.id}
            to={`/scan/${scan.id}`}
            className="block rounded-xl border bg-white shadow-sm p-4"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">
                {scan.type === "online" ? "🌐" : "🚗"}
              </div>

              <div className="flex-1">
                <h2 className="font-semibold">
                  {scan.title || "Untitled scan"}
                </h2>

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
