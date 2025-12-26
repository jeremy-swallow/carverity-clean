import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-white/10">
        {/* Background Image */}
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard"
          className="
            absolute inset-0 w-full h-full object-cover
            object-center
            sm:object-[center_top]
          "
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/70 to-black/80" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-white">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-4 text-slate-200 max-w-2xl">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="mt-6 flex gap-4">
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

      {/* FEATURE SECTIONS */}
      <main className="max-w-5xl mx-auto px-6 py-12">

        <div className="grid gap-12">

          <section>
            <h2 className="text-lg font-semibold">Online Listing Scan</h2>
            <p className="mt-1 text-slate-300 text-sm">
              Paste a car listing URL and get instant insights into risks,
              pricing flags, and seller patterns.
            </p>
            <Link to="/online-scan" className="mt-2 inline-block text-indigo-400">
              Run online scan →
            </Link>
          </section>

          <section>
            <h2 className="text-lg font-semibold">In-Person Inspection</h2>
            <p className="mt-1 text-slate-300 text-sm">
              Guided step-by-step checks while viewing a car on-site —
              photos, condition prompts, and risk highlights.
            </p>
            <Link to="/in-person-start" className="mt-2 inline-block text-indigo-400">
              Start in-person scan →
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}
