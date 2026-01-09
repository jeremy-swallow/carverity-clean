// src/pages/Home.tsx
import { Link, useNavigate } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";

export default function Home() {
  const navigate = useNavigate();
  const progress = loadProgress();

  function resumeScan() {
    if (!progress?.step) return;
    navigate(progress.step);
  }

  return (
    <div className="text-white">
      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-white/10">
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/85" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Confidence before you commit to a used car
          </h1>

          <p className="text-slate-200 max-w-2xl">
            Condition-aware inspection and pricing context to help you decide what’s worth
            pursuing — without pressure.
          </p>

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={() => navigate("/scan/online")}
              className="px-4 py-2 rounded-xl bg-blue-400 text-black font-semibold"
            >
              Start Online Scan
            </button>

            <button
              onClick={() => navigate("/scan/in-person/start")}
              className="px-4 py-2 rounded-xl bg-slate-300 text-black font-semibold"
            >
              Start In-Person Scan
            </button>

            {progress?.step && (
              <button
                onClick={resumeScan}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold"
              >
                Resume Scan
              </button>
            )}
          </div>

          <Link
            to="/my-scans"
            className="text-slate-300 underline text-sm mt-1"
          >
            View My Scans
          </Link>
        </div>
      </section>

      {/* INFORMATION CARDS */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-1">Online Listing Scan</h2>
          <p className="text-slate-300 text-sm mb-3">
            Paste a listing link and instantly analyse wording risks, missing details,
            and seller-provided information.
          </p>
          <Link to="/scan/online" className="text-blue-400 text-sm underline">
            Start online scan →
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-1">In-Person Inspection Mode</h2>
          <p className="text-slate-300 text-sm mb-3">
            Guided photo checklist with prompts, observations, and condition awareness
            helpful for real-world viewing.
          </p>
          <Link
            to="/scan/in-person/start"
            className="text-blue-400 text-sm underline"
          >
            Start in-person scan →
          </Link>
        </div>
      </section>
    </div>
  );
}
