/* =========================================================
   In-person start
   • Single, in-person–only inspection flow
   • No online scan linking
   • Sets expectations clearly and calmly
========================================================= */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";

export default function InPersonStart() {
  const navigate = useNavigate();

  useEffect(() => {
    // Always start fresh — no auto-resume
    clearProgress();
  }, []);

  function startInspection() {
    navigate("/scan/in-person/vehicle-details");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person inspection
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Start your in-person inspection
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <p className="text-sm text-slate-300">
          CarVerity will guide you through a calm, real-world inspection of the
          vehicle.
        </p>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>You’ll capture a few key exterior photos first</li>
          <li>Then follow guided checks as you move around the car</li>
          <li>You can note anything that feels worth confirming</li>
        </ul>

        <p className="text-[11px] text-slate-400">
          This inspection focuses on observations and confidence — not pricing
          or diagnosis.
        </p>
      </section>

      <button
        onClick={startInspection}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 shadow"
      >
        Start inspection
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Your progress is saved locally on this device only.
      </p>
    </div>
  );
}
