import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">

        <div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Smarter used-car checks
            <br />
            with CarVerity
          </h1>

          <p className="text-slate-300 text-lg mb-8">
            Analyse car listings, spot risk signals before you buy, and guide
            your in-person inspections with confidence.
          </p>

          <div className="flex gap-4">
            <Link
              to="/start-scan"
              className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 hover:bg-slate-800"
            >
              My scans
            </Link>
          </div>
        </div>

        {/* HERO IMAGE */}
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <img
            src="/hero.png"
            alt="Car dashboard"
            className="w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}
