import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-white/10">
        {/* Background image */}
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard at sunset"
          className="
            absolute inset-0 h-full w-full
            object-cover
            object-[center_60%]
            md:object-center
          "
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/80" />

        {/* Hero content */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold md:font-bold leading-tight">
              Smarter used-car checks with CarVerity
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-200 max-w-xl">
              Analyse car listings, spot risks before you buy, and guide your
              in-person inspections with confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/start-scan"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-600 text-sm sm:text-base font-medium text-white shadow-md shadow-indigo-500/30 transition"
              >
                Start a scan
              </Link>

              <Link
                to="/my-scans"
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-md bg-slate-900/80 hover:bg-slate-800/90 text-sm sm:text-base font-medium text-slate-100 border border-white/10 transition"
              >
                My scans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN OPTIONS SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Online listing scan */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold">
            Online Listing Scan
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-300 max-w-2xl">
            Paste a car listing URL and get instant insights into risks, pricing
            flags, and seller patterns.
          </p>
          <Link
            to="/online-start"
            className="mt-3 inline-flex items-center text-sm sm:text-base text-indigo-300 hover:text-indigo-200"
          >
            Run online scan →
          </Link>
        </div>

        {/* In-person inspection */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold">
            In-Person Inspection
          </h2>
          <p className="mt-1 text-sm sm:text-base text-slate-300 max-w-2xl">
            Guided step-by-step checks while viewing a car on-site — photos,
            condition prompts, and risk highlights.
          </p>
          <Link
            to="/inperson-start"
            className="mt-3 inline-flex items-center text-sm sm:text-base text-indigo-300 hover:text-indigo-200"
          >
            Start in-person scan →
          </Link>
        </div>
      </section>
    </div>
  );
}
