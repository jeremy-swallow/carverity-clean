import { Link } from "react-router-dom";
import { Search, ClipboardList, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
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

        {/* ACTIONS GRID */}
        <div className="grid gap-6">

          {/* ONLINE LISTING SCAN */}
          <Link
            to="/online-start"
            className="rounded-xl border bg-card hover:bg-accent transition
                       p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Search className="opacity-80" />
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  Online Listing Scan
                </h2>
                <p className="text-sm text-muted-foreground leading-snug">
                  Paste a car listing URL and get instant insights into risks,
                  pricing flags, and selling patterns.
                </p>
              </div>
            </div>
            <ArrowRight />
          </Link>

          {/* IN PERSON INSPECTION */}
          <Link
            to="/inperson-start"
            className="rounded-xl border bg-card hover:bg-accent transition
                       p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <ClipboardList className="opacity-80" />
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
            <ShieldCheck />
          </Link>

        </div>
      </div>
    </div>
  );
}
