import { useNavigate } from "react-router-dom";

export default function InPersonChecksIntro() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Condition checks
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Guided condition checks
      </h1>

      <p className="text-sm text-slate-400">
        You’ll step through a few short sections based on where you are around
        the vehicle. This is about what you notice — not diagnosing faults.
      </p>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-2">
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• Around the car</li>
          <li>• Inside the cabin</li>
          <li>• Short drive (if allowed)</li>
        </ul>
      </section>

      <button
        onClick={() => navigate("/scan/in-person/checks/around")}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3"
      >
        Start checks
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        You can skip sections you’re not able to complete.
      </p>
    </div>
  );
}
