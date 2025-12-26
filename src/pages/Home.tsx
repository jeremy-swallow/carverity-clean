import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden border-b border-white/10">

        {/* Background Image */}
        <img
          src="/photo-guides/hero.png"
          alt="Car interior dashboard at night"
          className="absolute inset-0 w-full h-full object-cover object-center sm:object-[center_top]"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/85" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6 py-20 sm:py-24">

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight text-white">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-3 sm:mt-4 text-slate-300 max-w-2xl text-base sm:text-lg">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-center"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white/90 text-center"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>


      {/* FEATURES SECTION */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-12">

        <div>
          <h2 className="text-lg font-semibold">Online Listing Scan</h2>
          <p className="text-slate-400">
            Paste a car listing URL and get instant insights into risks, pricing flags,
            and seller patterns.
          </p>

          <Link
            to="/online-scan"
            className="text-indigo-400 inline-block mt-2"
          >
            Run online scan →
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold">In-Person Inspection</h2>
          <p className="text-slate-400">
            Guided step-by-step checks while viewing a car on-site — photos,
            condition prompts, and risk highlights.
          </p>

          <Link
            to="/in-person-start"
            className="text-indigo-400 inline-block mt-2"
          >
            Start in-person scan →
          </Link>
        </div>
      </section>

    </div>
  );
}
