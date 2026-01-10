import { useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { unlockScan } from "../utils/scanUnlock";

export default function InPersonUnlock() {
  const navigate = useNavigate();
  const progress: any = loadProgress();

  if (!progress?.scanId) {
    navigate("/scan/in-person/start", { replace: true });
    return null;
  }

  function unlockLocally() {
    // Placeholder for payment / credit / whitelist confirmation
    unlockScan(progress.scanId);
    navigate("/scan/in-person/results", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Unlock
      </span>

      <h1 className="text-2xl font-semibold text-white">
        Unlock the full inspection report
      </h1>

      <section className="rounded-2xl bg-slate-900/70 border border-white/10 px-6 py-5 space-y-3">
        <p className="text-sm text-slate-300">
          Unlocking runs the full analysis for this inspection only.
        </p>

        <ul className="text-sm text-slate-300 list-disc ml-5 space-y-1">
          <li>Proceed / caution / walk-away assessment</li>
          <li>Key risk signals</li>
          <li>Negotiation guidance</li>
          <li>Printable report</li>
        </ul>
      </section>

      <button
        onClick={unlockLocally}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3"
      >
        Continue & unlock
      </button>

      <button
        onClick={() => navigate("/scan/in-person/preview")}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3"
      >
        Back
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Unlock applies only to this inspection.
      </p>
    </div>
  );
}
