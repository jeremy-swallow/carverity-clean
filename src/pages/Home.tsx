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

        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-20 flex flex-col gap-4">
          <div className="max-w-xl md:max-w-2xl flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Inspect a used car in person — with confidence.
            </h1>

            <p className="text-slate-200">
              CarVerity guides you step-by-step while you&apos;re standing next
              to the car, so you can spot issues, record evidence, and leave
              with a clear report and buyer-safe next steps.
            </p>

            <p className="text-slate-300">
              No mechanic tools. No guesswork. Just what you can see, check, and
              confirm.
            </p>

            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={() => navigate("/start-scan")}
                className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
              >
                Start in-person inspection
              </button>

              {progress?.step && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={resumeScan}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold"
                  >
                    Resume inspection
                  </button>
                  <span className="text-[11px] text-slate-300">
                    You’re partway through an inspection — nothing has been
                    lost.
                  </span>
                </div>
              )}
            </div>

            {/* HOW IT WORKS */}
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                How it works
              </p>

              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                <li className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>
                    Follow a guided inspection (outside, cabin, test drive)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>Record what you find (notes + photos)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-slate-400">•</span>
                  <span>
                    Get a buyer-ready summary (risk signals + what to clarify +
                    next steps)
                  </span>
                </li>
              </ul>
            </div>

            {/* Orientation link */}
            <Link
              to="/what-to-expect"
              className="text-slate-300 underline text-sm"
            >
              What to expect
            </Link>

            {/* Utility link */}
            <Link
              to="/my-scans"
              className="text-slate-300 underline text-sm mt-1"
            >
              View My Scans
            </Link>
          </div>
        </div>
      </section>

      {/* INFORMATION */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-10 grid gap-6 md:grid-cols-1">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-1">
            In-person inspection mode
          </h2>
          <p className="text-slate-300 text-sm mb-3">
            A guided, step-by-step companion designed to help you slow down,
            capture what matters, and build confidence before you decide to
            proceed.
          </p>
          <Link to="/start-scan" className="text-emerald-400 text-sm underline">
            Start inspection →
          </Link>
        </div>
      </section>
    </div>
  );
}
