import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative w-full overflow-hidden border-b border-white/10">

        {/* Background Image */}
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard at night"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Improved Overlay — fully opaque at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-28 sm:pt-32 sm:pb-40 min-h-[520px] sm:min-h-[640px] flex flex-col justify-center">

          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-4 text-slate-200 max-w-2xl">
            Analyse car listings, spot risks before you buy, and guide your in-person inspections
            with confidence.
          </p>

          <div className="mt-6 inline-flex gap-4 bg-black/40 sm:bg-transparent p-2 rounded-xl">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white/90"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <main className="max-w-5xl mx-auto px-6 py-16">

        <div className="space-y-12">

          <div>
            <h2 className="font-semibold text-white">Online Listing Scan</h2>
            <p className="text-slate-300 max-w-xl">
              Paste a car listing URL and get instant insights into risks, pricing flags, and seller patterns.
            </p>
            <Link to="/online-scan" className="text-indigo-400 mt-2 inline-block">
              Run online scan →
            </Link>
          </div>

          <div>
            <h2 className="font-semibold text-white">In-Person Inspection</h2>
            <p className="text-slate-300 max-w-xl">
              Guided step-by-step checks while viewing a car on-site — photos, condition prompts, and risk highlights.
            </p>
            <Link to="/in-person-scan" className="text-indigo-400 mt-2 inline-block">
              Start in-person scan →
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
