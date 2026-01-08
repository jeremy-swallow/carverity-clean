// src/pages/MyScans.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans, saveScan } from "../utils/scanStorage";
import { saveProgress, loadProgress } from "../utils/scanProgress";

interface ScanHistoryEvent {
  at: string;
  event: string;
}

interface PricingInsight {
  label: string;
  advice: string;
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

  data?: {
    pricingInsight?: PricingInsight;
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
    setScans(loadScans() ?? []);
  }, []);

  const progress = loadProgress();

  function refresh() {
    setScans(loadScans() ?? []);
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
    saveScan({
      ...scan,
      history: [
        ...(scan.history ?? []),
        { at: new Date().toISOString(), event },
      ],
    });
    refresh();
  }

  function renameScan(scan: SavedScan) {
    saveScan({
      ...scan,
      title: newTitle.trim(),
      history: [
        ...(scan.history ?? []),
        { at: new Date().toISOString(), event: "Renamed scan" },
      ],
    });
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

    return (
      text.includes(query.toLowerCase()) &&
      (filterType === "all" || s.type === filterType)
    );
  });

  const pairs = useMemo(() => buildPairs(filtered), [filtered]);

  function VehicleLabel(scan?: SavedScan) {
    if (!scan) return "Vehicle";
    const v = scan.vehicle ?? {};
    return [v.year, v.make, v.model].filter(Boolean).join(" ") || scan.title;
  }

  /* =========================================================
     Card
  ========================================================== */

  function PairedCard({ entry }: { entry: PairedEntry }) {
    const { online, inPerson } = entry;
    const primary = online ?? inPerson!;
    const pricing = primary.data?.pricingInsight;
    const dualComplete = Boolean(online && inPerson);
    const isRenaming = renameId === primary.id;

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-3">
        {dualComplete && (
          <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-sm text-emerald-200 font-semibold">
            Dual-scan complete — highest confidence
          </div>
        )}

        <div className="flex items-center justify-between">
          {isRenaming ? (
            <div className="flex gap-2 w-full">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-slate-800 border border-white/20"
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
            <>
              <h3 className="text-lg font-semibold text-white">
                {VehicleLabel(primary)}
              </h3>
              <button
                onClick={() => {
                  setRenameId(primary.id);
                  setNewTitle(primary.title);
                }}
                className="text-sm text-slate-400 underline"
              >
                Rename
              </button>
            </>
          )}
        </div>

        {pricing && (
          <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/25 px-3 py-2">
            <p className="text-sm font-semibold text-emerald-200">
              {pricing.label}
            </p>
            <p className="text-xs text-slate-300">
              {pricing.advice}
            </p>
          </div>
        )}

        <p className="text-sm text-slate-400">
          {new Date(primary.createdAt).toLocaleDateString()}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {online && !inPerson && (
            <button
              onClick={() => {
                addHistory(online, "Started in-person inspection");
                startInPerson(online);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
            >
              Add in-person inspection
            </button>
          )}

          {inPerson && !online && (
            <button
              onClick={() => {
                addHistory(inPerson, "Started online scan");
                startOnlineFromInPerson(inPerson);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-400 text-black font-semibold"
            >
              Run online scan (optional)
            </button>
          )}

          <button
            onClick={() => exportAsPDF(primary)}
            className="px-4 py-2 rounded-xl bg-slate-300 text-black font-semibold"
          >
            Export / Share PDF
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">My scans</h1>

        {progress?.step && (
          <button
            onClick={resumeScan}
            className="px-3 py-2 rounded-xl bg-amber-400 text-black text-sm font-semibold"
          >
            Resume unfinished scan
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
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
