import { Link } from "react-router-dom";
import { Search, ClipboardList, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* HERO */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Smarter used-car checks with CarVerity
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>
        </header>

        {/* ACTION CARDS */}
        <div className="grid gap-6">

          {/* ONLINE LISTING SCAN */}
          <Link
            to="/online-start"
            className="group rounded-xl border bg-card/70 backdrop-blur-sm
                       p-5 flex items-center justify-between
                       transition-all duration-200
                       hover:-translate-y-0.5 hover:border-primary/40
                       hover:shadow-[0_8px_40px_-10px_rgba(80,200,255,.25)]
                       hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <Search className="opacity-80 group-hover:opacity-100 transition" />
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  Online Listing Scan
                </h2>
                <p className="text-sm text-muted-foreground leading-snug">
                  Paste a car listing URL and get instant insights into risks,
                  pricing flags, and seller patterns.
                </p>
              </div>
            </div>
            <ArrowRight className="transition group-hover:translate-x-1" />
          </Link>

          {/* IN-PERSON INSPECTION */}
          <Link
            to="/inperson-start"
            className="group rounded-xl border bg-card/70 backdrop-blur-sm
                       p-5 flex items-center justify-between
                       transition-all duration-200
                       hover:-translate-y-0.5 hover:border-primary/40
                       hover:shadow-[0_8px_40px_-10px_rgba(120,255,200,.25)]
                       hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <ClipboardList className="opacity-80 group-hover:opacity-100 transition" />
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  In-Person Inspection
                </h2>
                <p className="text-sm text-muted-foreground leading-snug">
                  Guided step-by-step checks while viewing a car on site —
                  photos, condition prompts, and risk highlights.
                </p>
              </div>
            </div>
            <ShieldCheck className="transition group-hover:scale-105" />
          </Link>

        </div>
      </div>
    </div>
  );
}
