// src/pages/Home.tsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadScans, type SavedScan } from "../utils/scanStorage";

type ScanFilter = "all" | "online" | "in-person";

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Home() {
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [filter, setFilter] = useState<ScanFilter>("all");

  useEffect(() => {
    try {
      const saved = loadScans();
      setScans(saved);
    } catch (err) {
      console.error("Failed to load scans:", err);
      setScans([]);
    }
  }, []);

  const filteredScans =
    filter === "all"
      ? scans
      : scans.filter((scan) => scan.type === filter);

  const hasScans = scans.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO – calm, cropped image so no ghosted text */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-slate-950">
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="absolute inset-0 h-full w-full object-cover object-[center_top]"
        />
        {/* darken so our text is always readable, especially on mobile */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/85 to-slate-950/70" />

        <div className="relative max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight">
              Smarter used-car checks with CarVerity
            </h1>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Analyse car listings, spot risks before you buy, and guide your
              in-person inspections with confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/start-scan"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
              >
                Start a scan
              </Link>

              <Link
                to="/my-scans"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800/80 transition"
              >
                My scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DASHBOARD */}
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* HEADING */}
        <header className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {hasScans ? "Your scans" : "Start your first scan"}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            {hasScans
              ? "Pick up where you left off or start a new online listing or in-person inspection."
              : "No scans yet — begin with an online listing or in-person inspection."}
          </p>
        </header>

        {/* SCAN FILTER TABS (only show when we have scans) */}
        {hasScans && (
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-slate-900/80 p-1 border border-slate-700/70 text-xs sm:text-sm">
              {(["all", "online", "in-person"] as ScanFilter[]).map((value) => {
                const label =
                  value === "all"
                    ? "All"
                    : value === "online"
                    ? "Online"
                    : "In-person";

                const isActive = filter === value;

                return (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`px-3 sm:px-4 py-1.5 rounded-full font-medium transition ${
                      isActive
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SCAN LIST */}
        {hasScans && (
          <section className="space-y-3">
            {filteredScans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/60 px-4 py-6 text-sm text-slate-300">
                No{" "}
                <span className="font-medium">
                  {filter === "online"
                    ? "online"
                    : filter === "in-person"
                    ? "in-person"
                    : ""}
                </span>{" "}
                scans yet. Start a new scan below.
              </div>
            ) : (
              filteredScans.map((scan) => (
                <Link
                  key={scan.id}
                  to={`/scan/${scan.id}`}
                  className="block rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3.5 sm:px-5 sm:py-4 hover:border-indigo-500/70 hover:bg-slate-900 transition shadow-sm shadow-black/20"
                >
                  <div className="flex items-start gap-3">
                    {/* TYPE DOT */}
                    <div className="mt-1">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          scan.type === "online"
                            ? "bg-indigo-400"
                            : "bg-emerald-400"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* TOP ROW: type + date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="font-medium">
                          {scan.type === "online"
                            ? "Online Listing Scan"
                            : "In-Person Scan"}
                        </span>
                        {scan.createdAt && (
                          <span className="text-slate-500">
                            • {formatDate(scan.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* TITLE */}
                      <div className="mt-1 text-sm sm:text-base font-medium text-slate-50 truncate">
                        {scan.title || "Untitled scan"}
                      </div>

                      {/* OPTIONAL SUMMARY / URL */}
                      {scan.summary && (
                        <p className="mt-1 text-xs sm:text-sm text-slate-400 line-clamp-2">
                          {scan.summary}
                        </p>
                      )}
                      {!scan.summary && scan.listingUrl && (
                        <p className="mt-1 text-xs sm:text-sm text-slate-400 truncate">
                          {scan.listingUrl}
                        </p>
                      )}
                    </div>

                    {/* ACTION LABEL */}
                    <div className="mt-1 text-xs sm:text-sm font-medium text-indigo-300 whitespace-nowrap">
                      Open →
                    </div>
                  </div>
                </Link>
              ))
            )}
          </section>
        )}

        {/* ACTION CARDS – always visible, even when there are scans */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">
            Start a new scan
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Online listing card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-5 sm:px-5 sm:py-6 shadow-sm shadow-black/20">
              <h4 className="text-sm sm:text-base font-semibold text-slate-50">
                Online Listing Scan
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Paste a listing link and instantly analyse pricing, wording
                risks, and seller flags.
              </p>
              <Link
                to="/online-start"
                className="mt-4 inline-flex items-center text-xs sm:text-sm font-medium text-indigo-300 hover:text-indigo-200"
              >
                Start online scan →
              </Link>
            </div>

            {/* In-person card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-5 sm:px-5 sm:py-6 shadow-sm shadow-black/20">
              <h4 className="text-sm sm:text-base font-semibold text-slate-50">
                In-Person Inspection Mode
              </h4>
              <p className="mt-2 text-xs sm:text-sm text-slate-400">
                Guided on-site checklist with photos, prompts, and risk
                highlights.
              </p>
              <Link
                to="/in-person-start"
                className="mt-4 inline-flex items-center text-xs sm:text-sm font-medium text-indigo-300 hover:text-indigo-200"
              >
                Start in-person scan →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
