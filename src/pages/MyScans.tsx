// src/pages/MyScans.tsx
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

  history?: ScanHistoryEvent[];
}

/* =========================================================
   Pairing helpers — link scans that belong to the same car
========================================================= */

function normaliseVehicleKey(scan: SavedScan): string | null {
  const v = scan.vehicle;
  if (!v) return null;

  const parts = [v.year, v.make, v.model]
    .map((x) => (x ?? "").toLowerCase().trim())
    .filter(Boolean);

  return parts.length >= 2 ? parts.join("|") : null;
}

type PairedEntry = {
  key: string;
  online?: SavedScan;
  inPerson?: SavedScan;
};

function buildPairs(scans: SavedScan[]): PairedEntry[] {
  const map = new Map<string, PairedEntry>();

  for (const scan of scans) {
    const urlKey =
      (scan.listingUrl ?? "").trim().toLowerCase() || undefined;
    const vehicleKey = normaliseVehicleKey(scan) ?? undefined;

    const matchKey = urlKey || vehicleKey || scan.id;

    if (!map.has(matchKey)) {
      map.set(matchKey, { key: matchKey });
    }

    const entry = map.get(matchKey)!;

    if (scan.type === "online") entry.online = scan;
    if (scan.type === "in-person") entry.inPerson = scan;
  }

  return Array.from(map.values());
}

/* =========================================================
   Component
========================================================= */

export default function MyScans() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "online" | "in-person"
  >("all");
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

  function startInPerson(fromScan: SavedScan) {
    saveProgress({
      type: "in-person",
      step: "/scan/in-person/start",
      startedAt: new Date().toISOString(),
      listingUrl: fromScan.listingUrl ?? "",
      vehicle: fromScan.vehicle ?? {},
      fromOnlineScan: true,
    });

    navigate("/scan/in-person/start");
  }

  function startOnlineFromInPerson(scan: SavedScan) {
    saveProgress({
      type: "online",
      step: "/scan/online",
      startedAt: new Date().toISOString(),
      listingUrl: scan.listingUrl ?? "",
      vehicle: scan.vehicle ?? {},
    });

    navigate("/scan/online");
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
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  const filtered = sorted.filter((s) => {
    const text = [
      s.title,
      s.vehicle?.make,
      s.vehicle?.model,
      s.vehicle?.year,
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = text.includes(query.toLowerCase());
    const matchesType = filterType === "all" || s.type === filterType;

    return matchesQuery && matchesType;
  });

  const pairs = useMemo(() => buildPairs(filtered), [filtered]);

  function VehicleLabel(scan?: SavedScan) {
    if (!scan) return "Vehicle";
    const v = scan.vehicle ?? {};
    const label = [v.year, v.make, v.model].filter(Boolean).join(" ");
    return label || scan.title;
  }

  /* =========================================================
     Card for paired (or single) entry
  ========================================================== */

  function PairedCard({ entry }: { entry: PairedEntry }) {
    const { online, inPerson } = entry;

    const dualComplete = Boolean(online && inPerson);
    const primary = online ?? inPerson!;

    const isRenaming = renameId === primary.id;

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
                onClick={() => renameScan(primary)}
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
              <h3 className="text-lg font-semibold">
                {VehicleLabel(primary)}
              </h3>
              <button
                onClick={() => {
                  setRenameId(primary.id);
                  setNewTitle(primary.title);
                }}
                className="text-sm text-slate-300 underline"
              >
                Rename
              </button>
            </div>
          )}

          <span className="text-sm text-slate-400">
            {new Date(primary.createdAt).toLocaleString()}
          </span>

          {primary.listingUrl && (
            <a
              href={primary.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm underline"
            >
              View listing
            </a>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            {online && (
              <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/70">
                Online scan
              </span>
            )}
            {inPerson && (
              <span className="px-2 py-1 rounded-lg text-xs bg-slate-700/70">
                In-person inspection
              </span>
            )}

            {dualComplete && (
              <span className="px-2 py-1 rounded-lg text-xs bg-emerald-400/90 text-black font-semibold">
                Dual-scan complete — strongest confidence
              </span>
            )}

            {!dualComplete && online && (
              <span className="px-2 py-1 rounded-lg text-xs bg-indigo-400/80 text-black">
                Online scan completed — add in-person check
              </span>
            )}

            {!dualComplete && inPerson && (
              <span className="px-2 py-1 rounded-lg text-xs bg-teal-300/80 text-black">
                In-person inspection completed — add online scan (optional)
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {online && !inPerson && (
              <button
                onClick={() => {
                  addHistory(online, "Started in-person inspection");
                  startInPerson(online);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
              >
                Continue — in-person inspection
              </button>
            )}

            {inPerson && !online && (
              <button
                onClick={() => {
                  addHistory(inPerson, "Started online scan");
                  startOnlineFromInPerson(inPerson);
                }}
                className="px-3 py-2 rounded-xl bg-indigo-400 text-black font-semibold"
              >
                Run online listing scan (optional)
              </button>
            )}

            <button
              onClick={() => exportAsPDF(primary)}
              className="px-3 py-2 rounded-xl bg-slate-300 text-black font-semibold"
            >
              Export / Share PDF
            </button>
          </div>

          {!!primary.history?.length && (
            <details className="mt-3">
              <summary className="text-sm text-slate-300 cursor-pointer">
                View scan activity timeline
              </summary>

              <ul className="mt-2 text-sm text-slate-400">
                {primary.history.map((h, i) => (
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

  /* =========================================================
     Empty state
  ========================================================== */

  if (!pairs.length) {
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

  /* =========================================================
     Main render
  ========================================================== */

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

      <div className="flex flex-col gap-3">
        {pairs.map((p) => (
          <PairedCard key={p.key} entry={p} />
        ))}
      </div>
    </div>
  );
}
