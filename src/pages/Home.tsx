import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground">

      {/* HERO SECTION */}
      <section
        className="relative h-[420px] w-full bg-cover bg-center bg-no-repeat flex items-center"
        style={{ backgroundImage: "url('/hero.png')" }}
      >
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px]" />

        <div className="relative max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">
            Smarter used-car checks with CarVerity
          </h1>

          <p className="text-muted-foreground max-w-2xl mb-6">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>

          <div className="flex gap-3">
            <Link
              to="/online-start"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Start a scan
            </Link>

            <Link
              to="/my-scans"
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-md"
            >
              My scans
            </Link>
          </div>
        </div>
      </section>

      {/* ACTION CARDS */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid gap-6">

        <div>
          <h2 className="font-semibold text-lg">Online Listing Scan</h2>
          <p className="text-muted-foreground text-sm">
            Paste a car listing URL and get instant insights into risks,
            pricing flags, and seller patterns.
          </p>
          <Link to="/online-start" className="text-indigo-400 text-sm mt-2 inline-block">
            Run online scan →
          </Link>
        </div>

        <div>
          <h2 className="font-semibold text-lg">In-Person Inspection</h2>
          <p className="text-muted-foreground text-sm">
            Guided step-by-step checks while viewing a car on-site — photos,
            condition prompts, and risk highlights.
          </p>
          <Link to="/inperson-start" className="text-indigo-400 text-sm mt-2 inline-block">
            Start in-person scan →
          </Link>
        </div>
      </div>
    </div>
  );
}
