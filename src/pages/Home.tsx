import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="flex flex-col">

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[380px] md:min-h-[460px] overflow-hidden">

        {/* Background image */}
        <img
          src="/hero.png"
          alt="Car interior dashboard at night"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-transparent" />

        {/* Hero content */}
        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-3 max-w-2xl text-slate-300">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              to="/start-scan"
              className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white"
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

      {/* ======================= */}
      {/* FEATURE SECTIONS BELOW  */}
      {/* ======================= */}
      <section className="max-w-5xl mx-auto px-6 py-16 space-y-14">

        <div>
          <h2 className="text-lg font-semibold">Online Listing Scan</h2>
          <p className="text-slate-400">
            Paste a car listing URL and get instant insights into risks,
            pricing flags, and seller patterns.
          </p>
          <Link to="/online-scan" className="mt-2 inline-block text-indigo-400">
            Run online scan →
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold">In-Person Inspection</h2>
          <p className="text-slate-400">
            Guided step-by-step checks while viewing a car on-site —
            photos, condition prompts, and risk highlights.
          </p>
          <Link to="/inperson-start" className="mt-2 inline-block text-indigo-400">
            Start in-person scan →
          </Link>
        </div>

      </section>
    </main>
  );
}
