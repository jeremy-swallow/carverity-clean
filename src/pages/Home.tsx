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

            {/* BEST FOR */}
            <p className="text-[12px] text-slate-300 leading-relaxed">
              <span className="text-slate-400">Best for:</span>{" "}
              private sales, car yards, and first-time buyers.
            </p>

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
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-12 grid gap-6">
        {/* TRUST / WHO IT'S FOR */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold mb-2">
            Built for everyday buyers (not mechanics)
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            If you don’t buy cars often, it’s easy to miss small warning signs —
            or get pressured into a decision you’re not ready for. CarVerity is
            a calm guide that helps you slow down, stay organised, and focus on
            what actually matters.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                No tools required
              </p>
              <p className="text-slate-200 text-sm mt-2">
                You don’t need a jack, scanner, or mechanical knowledge.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                No underbody checks
              </p>
              <p className="text-slate-200 text-sm mt-2">
                Everything is designed to be done standing normally around the
                car.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Buyer-safe wording
              </p>
              <p className="text-slate-200 text-sm mt-2">
                Clear guidance without alarmist language or pressure.
              </p>
            </div>
          </div>
        </div>

        {/* WHAT YOU GET AT THE END */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold mb-2">What you get at the end</h2>

          <p className="text-slate-300 text-sm leading-relaxed">
            When you finish the inspection, CarVerity turns what you recorded
            into a clean, structured report — so you can decide what to do next
            with confidence.
          </p>

          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">Priority findings</span>{" "}
                (the biggest issues worth paying attention to)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">
                  Items worth clarifying
                </span>{" "}
                (questions to ask before you commit)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                <span className="font-semibold text-white">Photo evidence</span>{" "}
                (what you captured during the scan)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-400">•</span>
              <span>
                Optional next step:{" "}
                <span className="font-semibold text-white">
                  negotiation advice
                </span>{" "}
                (kept separate from the report)
              </span>
            </li>
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/start-scan")}
              className="px-4 py-2 rounded-xl bg-emerald-400 text-black font-semibold"
            >
              Start inspection
            </button>

            <Link
              to="/what-to-expect"
              className="px-4 py-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 font-semibold transition"
            >
              See what the scan includes
            </Link>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-white">Already started?</h3>
            <p className="text-slate-300 text-sm mt-1">
              You can resume your in-progress inspection anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {progress?.step && (
              <button
                onClick={resumeScan}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-semibold"
              >
                Resume inspection
              </button>
            )}

            <Link
              to="/my-scans"
              className="px-4 py-2 rounded-xl border border-white/15 bg-slate-950/30 hover:bg-slate-900 text-slate-200 font-semibold transition"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
