import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO SECTION */}
      <section className="relative h-[420px] md:h-[520px] overflow-hidden">
        
        {/* Background Image */}
        <img
          src="/hero.png"
          alt="Car interior dashboard at night"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient + Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="mt-4 text-slate-300 max-w-2xl">
            Analyse car listings, spot risks before you buy, and guide your in-person
            inspections with confidence.
          </p>

          <div className="mt-6 flex gap-4">
            <Link
              to="/start-scan"
              className="px-5 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition shadow-md"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>

      {/* === REST OF THE HOMEPAGE CONTENT === */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 space-y-10">

        <section>
          <h2 className="text-xl font-semibold">Online Listing Scan</h2>
          <p className="text-slate-300 mt-1">
            Paste a car listing URL and get instant insights into risks, pricing flags, and seller patterns.
          </p>
          <Link to="/online-start" className="mt-3 inline-block underline">
            Run online scan →
          </Link>
        </section>

        <section>
          <h2 className="text-xl font-semibold">In-Person Inspection</h2>
          <p className="text-slate-300 mt-1">
            Guided step-by-step checks while viewing a car on-site — photos, condition prompts, and risk highlights.
          </p>
          <Link to="/inperson-start" className="mt-3 inline-block underline">
            Start in-person scan →
          </Link>
        </section>

      </main>
    </div>
  );
}
