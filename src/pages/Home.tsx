import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground">
      <div className="flex flex-col">

        {/* ===========================
             HERO SECTION
        ============================ */}
        <section
          className="relative h-[460px] w-full bg-cover bg-center bg-no-repeat flex items-center"
          style={{ backgroundImage: "url('/hero.png')" }}
        >
          {/* Softer overlay so the image is visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/30" />

          <div className="relative max-w-5xl mx-auto px-6">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold mb-4 tracking-tight">
                Smarter used-car checks with CarVerity
              </h1>

              <p className="text-muted-foreground text-lg mb-6">
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
          </div>
        </section>

        {/* ===========================
             MAIN ACTION CARDS
        ============================ */}
        <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

          {/* ONLINE LISTING SCAN */}
          <div>
            <h2 className="font-semibold text-lg">Online Listing Scan</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Paste a car listing URL and get instant insights into risks,
              pricing flags, and seller patterns.
            </p>
            <Link
              to="/online-start"
              className="text-indigo-400 hover:underline"
            >
              Run online scan →
            </Link>
          </div>

          {/* IN-PERSON INSPECTION */}
          <div>
            <h2 className="font-semibold text-lg">In-Person Inspection</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Guided step-by-step checks while viewing a car on-site —
              photos, condition prompts, and risk highlights.
            </p>
            <Link
              to="/inperson-start"
              className="text-indigo-400 hover:underline"
            >
              Start in-person scan →
            </Link>
          </div>

        </main>
      </div>
    </div>
  );
}
