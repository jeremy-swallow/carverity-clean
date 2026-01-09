import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadScans } from "../utils/scanStorage";
import { loadProgress } from "../utils/scanProgress";

interface PricingInsight {
  verdict?: "missing" | "info" | "room" | "concern";
  confidence: string;
  advice: string;
  buyerRiskReason?: string;
}

interface ScanHistoryEvent {
  at: string;
  event: string;
}

interface SavedScan {
  id: string;
  type: "online" | "in-person";
  title: string;
  createdAt: string;
  listingUrl?: string;
  fromOnlineScan?: boolean;

  vehicle?: {
    year?: string;
    make?: string;
    model?: string;
    variant?: string;
  };

  data?: {
    pricingInsight?: PricingInsight;
  };

  history?: ScanHistoryEvent[];
}

/* =========================================================
   Pairing helpers — link scans for same vehicle
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
    const urlKey = (scan.listingUrl ?? "").trim().toLowerCase() || undefined;
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
  const progress = loadProgress();

  useEffect(() => {
    setScans(loadScans() ?? []);
  }, []);

  function resumeScan() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  const sorted = useMemo(
    () =>
      [...scans].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [scans]
  );

  const pairs = useMemo(() => buildPairs(sorted), [sorted]);

  function VehicleLabel(scan?: SavedScan) {
    if (!scan) return "Vehicle";
    const v = scan.vehicle ?? {};
    return [v.year, v.make, v.model].filter(Boolean).join(" ") || scan.title;
  }

  /* =========================================================
     Card
  ========================================================== */

  function PricingBadge({ insight }: { insight: PricingInsight }) {
    const text = insight.confidence || "";

    const classes =
      text.includes("reasonable")
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
        : text.includes("negotiation")
        ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
        : text.includes("Low")
        ? "bg-red-500/20 text-red-300 border-red-400/40"
        : "bg-slate-500/20 text-slate-300 border-slate-400/30";

    return (
      <span
        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${classes}`}
      >
        {text}
      </span>
    );
  }

  function PairedCard({ entry }: { entry: PairedEntry }) {
    const { online, inPerson } = entry;
    const primary = online ?? inPerson!;
    const pricing = primary.data?.pricingInsight;
    const dualComplete = Boolean(online && inPerson);

    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 space-y-3">
        {dualComplete && (
          <div className="rounded-lg bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-sm text-emerald-200 font-semibold">
            Dual-scan complete — highest confidence
          </div>
        )}

        <h3 className="text-lg font-semibold text-white">
          {VehicleLabel(primary)}
        </h3>

        {pricing && (
          <div className="rounded-lg bg-slate-950/40 border border-white/10 px-3 py-2 space-y-1">
            <PricingBadge insight={pricing} />
            <p className="text-xs text-slate-300">{pricing.advice}</p>

            {pricing.buyerRiskReason && (
              <p className="text-xs text-red-300">
                ⚠ Buyer risk noted — review inspection findings
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-slate-400">
          {new Date(primary.createdAt).toLocaleDateString()}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {online && !inPerson && (
            <button
              onClick={() => {
                // NOTE: we do not saveProgress here in this version (kept as-is)
                navigate("/scan/in-person/start");
              }}
              className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
            >
              Add in-person inspection
            </button>
          )}

          <button
            onClick={() => window.print()}
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
        <p className="text-slate-400 mb-6">No saved scans yet.</p>

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

      <div className="flex flex-col gap-3">
        {pairs.map((p) => (
          <PairedCard key={p.key} entry={p} />
        ))}
      </div>
    </div>
  );
}
