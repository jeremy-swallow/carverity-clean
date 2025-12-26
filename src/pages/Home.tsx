import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import { loadScans } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function Home() {
  const [scans, setScans] = useState<SavedScan[]>([]);

  useEffect(() => {
    setScans(loadScans());
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-slate-100">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Start your first scan
        </h1>
        <p className="text-slate-400">
          No scans yet — begin with an online listing or in-person inspection.
        </p>
      </div>

      {/* ==============================================
          SCAN LIST (MOBILE CARD LAYOUT)
      =============================================== */}
      {scans.length > 0 && (
        <div className="space-y-4 mb-10">
          {scans.map((scan) => (
            <Link
              key={scan.id}
              to={
                scan.type === "online"
                  ? `/online-results?id=${scan.id}`
                  : `/in-person-summary?id=${scan.id}`
              }
            >
              <div className="border border-white/10 rounded-2xl p-4 bg-slate-900/40 shadow-sm hover:border-indigo-400/40 transition">

                {/* ROW 1 — TYPE + DATE */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        scan.type === "online"
                          ? "bg-indigo-400"
                          : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-sm font-medium capitalize">
                      {scan.type === "online"
                        ? "Online Listing Scan"
                        : "In-Person Scan"}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* ROW 2 — TITLE */}
                <div className="text-base font-semibold mb-2">
                  {scan.title || "Untitled scan"}
                </div>

                {/* ROW 3 — FOOTER */}
                <div className="flex justify-end">
                  <span className="text-indigo-300 text-sm">
                    {scan.completed ? "View report →" : "Resume →"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ==============================================
          ACTION CARDS
      =============================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ONLINE SCAN */}
        <div className="border border-white/10 rounded-2xl p-4 bg-slate-900/40">
          <h3 className="font-semibold mb-2">Online Listing Scan</h3>
          <p className="text-slate-400 mb-3">
            Paste a listing link and instantly analyse pricing, wording risks,
            and seller flags.
          </p>
          <Link to="/online-start" className="text-indigo-300">
            Start online scan →
          </Link>
        </div>

        {/* IN-PERSON SCAN */}
        <div className="border border-white/10 rounded-2xl p-4 bg-slate-900/40">
          <h3 className="font-semibold mb-2">In-Person Inspection Mode</h3>
          <p className="text-slate-400 mb-3">
            Guided on-site checklist with photos, prompts, and risk highlights.
          </p>
          <Link to="/in-person-start" className="text-indigo-300">
            Start in-person scan →
          </Link>
        </div>
      </div>
    </div>
  );
}
