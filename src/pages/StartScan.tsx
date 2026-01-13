// src/pages/StartScan.tsx
import { useNavigate } from "react-router-dom";
import { loadCredits } from "../utils/scanCredits";

export default function StartScan() {
  const navigate = useNavigate();

  function beginInPerson() {
    const credits = loadCredits();

    // Hard gate: must have at least 1 credit to start a scan
    if (credits <= 0) {
      navigate("/pricing?reason=no_credits");
      return;
    }

    navigate("/scan/in-person/start");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person inspection
      </span>

      <h1 className="text-2xl font-semibold text-white">
        Begin your in-person inspection
      </h1>

      <p className="text-slate-300">
        CarVerity guides you through a calm, real-world inspection of the
        vehicle. You’ll take a few key photos, follow guided checks, and note
        anything worth confirming.
      </p>

      <p className="text-sm text-slate-400">
        This process focuses on observations and confidence — not pricing or
        diagnosis.
      </p>

      <button
        onClick={beginInPerson}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3 shadow"
      >
        Start in-person inspection
      </button>
    </div>
  );
}
