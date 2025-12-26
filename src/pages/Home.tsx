import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="bg-slate-900 text-white">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-white/10">

        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/85" />

        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-4 text-slate-300 max-w-2xl">
            Analyse car listings, spot risk signals before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS — (no duplicate hero heading here anymore) */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid gap-6 md:grid-cols-3">

        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur">
          <h3 className="font-semibold mb-2">Online Listing Scan</h3>
          <p className="text-slate-300 text-sm mb-3">
            Paste a listing link and instantly analyse pricing, wording risks, and seller flags.
          </p>
          <Link to="/start-scan" className="text-indigo-300 hover:text-indigo-200 text-sm">
            Start online scan →
          </Link>
        </div>

        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur">
          <h3 className="font-semibold mb-2">In-Person Inspection Mode</h3>
          <p className="text-slate-300 text-sm mb-3">
            Guided on-site checklist with photos, prompts, and condition flags.
          </p>
          <Link to="/inperson-start" className="text-indigo-300 hover:text-indigo-200 text-sm">
            Start in-person scan →
          </Link>
        </div>

        <div className="border border-white/10 rounded-xl p-5 bg-slate-800/30 backdrop-blur">
          <h3 className="font-semibold mb-2">Your Scan History</h3>
          <p className="text-slate-300 text-sm mb-3">
            Re-open reports and compare vehicles side-by-side.
          </p>
          <Link to="/my-scans" className="text-indigo-300 hover:text-indigo-200 text-sm">
            View my scans →
          </Link>
        </div>
      </section>
    </div>
  );
}
