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
              Confidence when you’re standing next to the car
            </h1>

            <p className="text-slate-200">
              CarVerity guides you through a calm, in-person inspection —
              helping you notice, document, and talk through real condition
              findings without guesswork or pressure.
            </p>

            <p className="text-slate-300 text-sm">
              No online assumptions. No diagnosis. Just what you actually see.
            </p>

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={() => navigate("/scan/in-person/start")}
                className="px-5 py-2.5 rounded-xl bg-emerald-400 text-black font-semibold"
              >
                Start in-person inspection
              </button>

              {progress?.step && (
                <button
                  onClick={resumeScan}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-semibold"
                >
                  Resume inspection
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <Link
                to="/what-to-expect"
                className="text-slate-300 underline text-sm"
              >
                What to expect
              </Link>

              <Link
                to="/my-scans"
                className="text-slate-300 underline text-sm"
              >
                View my scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTING INFO */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-1">
            Designed for real inspections
          </h2>
          <p className="text-slate-300 text-sm">
            CarVerity is built for the moment you’re standing next to the car —
            not for analysing listings or making assumptions from seller
            wording.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="text-lg font-semibold mb-1">
            Helps you ask the right questions
          </h2>
          <p className="text-slate-300 text-sm">
            We help you document what you see and turn it into calm,
            confidence-building conversations with the seller.
          </p>
        </div>
      </section>
    </div>
  );
}
