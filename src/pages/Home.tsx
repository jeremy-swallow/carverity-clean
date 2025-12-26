import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadScans } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function Home() {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [filter, setFilter] =
    useState<"all" | "online" | "in-person" | "completed">("all");

  useEffect(() => {
    const data = loadScans();
    setScans(data ?? []);
  }, []);

  const displayScans =
    filter === "all" ? scans : scans.filter((s) => s.type === filter);

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* HERO */}
      <section className="relative">
        <img
          src="/hero.png"
          alt="Car interior driving hero"
          className="w-full h-[520px] object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60" />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Smarter used-car<br />checks with CarVerity
            </h1>

            <p className="text-slate-200 max-w-xl mb-6">
              Analyse car listings, spot risk signals before you buy,
              and guide your in-person inspections with confidence.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                to="/start-scan"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium"
              >
                Start a scan
              </Link>

              <Link
                to="/my-scans"
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl border border-white/10"
              >
                My scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SCAN PANEL */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-4 mt-6">
        <div className="border border-white/10 rounded-2xl p-4 sm:p-5 bg-slate-800/40 backdrop-blur">

          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h3 className="font-semibold text-lg sm:text-base">
              {displayScans.length ? "Recent scans" : "Start your first scan"}
            </h3>

            {/* FILTER TABS */}
            <div className="flex gap-1 sm:gap-2 text-xs bg-slate-900/70 rounded-full p-1 border border-white/10 overflow-x-auto">
              {[
                { key: "all", label: "All" },
                { key: "online", label: "Online" },
                { key: "in-person", label: "In-person" },
                { key: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as any)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap ${
                    filter === tab.key
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:bg-slate-700/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* EMPTY STATE */}
          {displayScans.length === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-slate-300 text-sm">
                No scans yet — begin with an online listing
                or in-person inspection.
              </p>

              <Link
                to="/start-scan"
                className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
              >
                Start →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayScans.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/scan/${scan.id}`}
                  className="border border-white/10 rounded-xl p-3 bg-slate-900/40 hover:bg-slate-800/60 transition"
                >
                  <div className="flex justify-between">
                    <div>
                      <strong className="text-sm">{scan.title}</strong>
                      <p className="text-xs text-slate-300">
                        {scan.createdAt}
                      </p>
                    </div>

                    <span className="text-xs px-2 py-1 rounded bg-slate-700">
                      {scan.type}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
