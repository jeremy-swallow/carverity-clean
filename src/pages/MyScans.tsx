import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans, saveScan } from "../utils/scanStorage";
import { saveProgress, loadProgress } from "../utils/scanProgress";

interface ScanHistoryEvent {
  at: string;
  event: string;
}

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
  };

  // 🟢 Added and typed correctly
  history?: ScanHistoryEvent[];
}

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "online" | "in-person">(
    "all"
  );
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    const stored = loadScans();
    setScans(stored ?? []);
  }, []);

  const progress = loadProgress();

  function refresh() {
    const stored = loadScans();
    setScans(stored ?? []);
  }

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

  function addHistory(scan: SavedScan, event: string) {
    const updated: SavedScan = {
      ...scan,
      history: [
        ...(scan.history ?? []),
        { at: new Date().toISOString(), event },
      ],
    };

    saveScan(updated);
    refresh();
  }

  function renameScan(scan: SavedScan) {
    const updated: SavedScan = {
      ...scan,
      title: newTitle.trim(),
      history: [
        ...(scan.history ?? []),
        { at: new Date().toISOString(), event: "Renamed scan" },
      ],
    };

    saveScan(updated);
    setRenameId(null);
    setNewTitle("");
    refresh();
  }

  function exportAsPDF(scan: SavedScan) {
    addHistory(scan, "Exported scan as PDF");
    window.print();
  }

  const sorted = useMemo(
    () =>
      [...scans].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  const filtered = sorted.filter((s) => {
    const text = [s.title, s.vehicle?.make, s.vehicle?.model, s.vehicle?.year]
      .join(" ")
      .toLowerCase();

    const matchesQuery = text.includes(query.toLowerCase());
    const matchesType = filterType === "all" || s.type === filterType;

    return matchesQuery && matchesType;
  });

  const onlineScans = filtered.filter((s) => s.type === "online");
  const inPersonScans = filtered.filter((s) => s.type === "in-person");

  function VehicleLabel(scan: SavedScan) {
    const v = scan.vehicle ?? {};
    const label = [v.year, v.make, v.model].filter(Boolean).join(" ");
    return label || scan.title;
  }

  function ScanCard(scan: SavedScan) {
    const isRenaming = renameId === scan.id;

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4">
        <div className="flex flex-col gap-2">
          {isRenaming ? (
            <div className="flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="px-2 py-1 rounded bg-slate-800 border border-white/20"
              />
              <button
                onClick={() => renameScan(scan)}
                className="px-3 py-1 rounded bg-emerald-400 text-black font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setRenameId(null)}
                className="px-3 py-1 rounded bg-slate-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{VehicleLabel(scan)}</h3>
              <button
                onClick={() => {
                  setRenameId(scan.id);
                  setNewTitle(scan.title);
                }}
                className="text-sm text-slate-300 underline"
              >
                Rename
              </button>
            </div>
          )}

          <span className="text-sm text-slate-400">
            {new Date(scan.createdAt).toLocaleString()}
          </span>

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

          <div className="mt-1 flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/70">
              {scan.type === "online" ? "Online scan" : "In-person inspection"}
            </span>

            {scan.fromOnlineScan && scan.type === "in-person" && (
              <span className="px-2 py-1 rounded-lg text-xs bg-purple-700/60">
                Follow-up
              </span>
            )}

            {/* NEW — show lock state for online scans */}
            {scan.type === "online" && (
              <span
                className={`px-2 py-1 rounded-lg text-xs ${
                  scan.isUnlocked
                    ? "bg-emerald-500/80 text-black"
                    : "bg-amber-400/80 text-black"
                }`}
              >
                {scan.isUnlocked
                  ? "Unlocked — full scan"
                  : "Locked — preview only"}
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {scan.type === "online" && (
              <button
                onClick={() => {
                  addHistory(scan, "Started in-person inspection");
                  startInPerson(scan);
                }}
                className="px-3 py-2 rounded-xl bg-blue-400 text-black font-semibold"
              >
                Start in-person inspection
              </button>
            )}

            <button
              onClick={() => exportAsPDF(scan)}
              className="px-3 py-2 rounded-xl bg-slate-300 text-black font-semibold"
            >
              Export / Share PDF
            </button>
          </div>

          {!!scan.history?.length && (
            <details className="mt-3">
              <summary className="text-sm text-slate-300 cursor-pointer">
                View scan activity timeline
              </summary>

              <ul className="mt-2 text-sm text-slate-400">
                {scan.history.map((h, i) => (
                  <li key={i}>
                    {new Date(h.at).toLocaleString()} — {h.event}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">My scans</h1>
        <p className="text-slate-400 mb-6">
          No scans match your search or filters.
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

      <div className="mb-6 flex flex-wrap gap-2">
        <input
          placeholder="Search make, model, or title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10"
        >
          <option value="all">All scans</option>
          <option value="online">Online only</option>
          <option value="in-person">In-person only</option>
        </select>
      </div>

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

      {!!inPersonScans.length && (
        <>
          <h2 className="text-lg font-semibold mb-2">In-person inspections</h2>
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
