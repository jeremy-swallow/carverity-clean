import { Link } from "react-router-dom";
import { Search, ClipboardList, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 md:py-12">

        {/* INTRO TAGLINE ROW */}
        <div className="mb-4 sm:mb-5 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium
                           bg-teal-300/10 text-teal-200 border border-teal-300/30">
            Built to help buyers make smarter car decisions
          </span>
        </div>

        {/* EARLY ACCESS BADGE */}
        <div className="mb-6 sm:mb-8">
          <span className="px-2 py-1 rounded-md text-[11px] font-medium
                           bg-white/8 text-muted-foreground border border-white/15">
            Early Access — features and design are improving continuously
          </span>
        </div>

        {/* HERO */}
        <header className="mb-10 sm:mb-12 md:mb-14">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-3">
            Smarter used-car checks with CarVerity
          </h1>
          <p className="text-muted-foreground/90 text-base sm:text-lg leading-relaxed">
            Analyse car listings, spot risks before you buy, and guide your
            in-person inspections with confidence.
          </p>
        </header>

        {/* SECTION HEADER + DIVIDER */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xs sm:text-sm font-medium tracking-wider uppercase text-muted-foreground/90">
            Start a scan
          </h3>
        </div>
        <div className="border-t border-white/20 mb-5 sm:mb-6" />

        {/* ACTION CARDS */}
        <div className="grid gap-4 sm:gap-5 md:gap-6">

          {/* ONLINE LISTING SCAN */}
          <Link
            to="/online-start"
            className="group rounded-xl border relative overflow-hidden
                       bg-card/80 backdrop-blur-sm
                       p-4 sm:p-5 flex items-center justify-between
                       transition-all duration-200 outline-none
                       hover:-translate-y-0.5 hover:border-teal-300/50
                       hover:shadow-[0_14px_44px_-10px_rgba(80,200,255,.34)]
                       hover:bg-card
                       focus-visible:ring-2 focus-visible:ring-teal-300/60
                       focus-visible:ring-offset-[1px] focus-visible:ring-offset-background
                       active:scale-[0.99]"
          >
            {/* accessible glow ring */}
            <div className="pointer-events-none absolute inset-0 rounded-xl
                            opacity-0 group-hover:opacity-90
                            transition
                            ring-0 group-hover:ring-1
                            ring-teal-300/35" />

            {/* sheen */}
            <div className="pointer-events-none absolute inset-0 opacity-70
                            bg-[radial-gradient(120%_80%_at_0%_-10%,rgba(90,220,255,.14),transparent)]
                            group-hover:opacity-100 transition" />
            <div className="pointer-events-none absolute inset-0 rounded-xl
                            border border-white/10" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <Search className="opacity-90 group-hover:opacity-100 transition" />
              <div>
                <h2 className="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">
                  Online Listing Scan
                </h2>
                <p className="text-sm text-muted-foreground/95 leading-snug">
                  Paste a car listing URL and get instant insights into risks,
                  pricing flags, and seller patterns.
                </p>
              </div>
            </div>

            <ArrowRight className="relative transition group-hover:translate-x-1" />
          </Link>

          {/* IN-PERSON INSPECTION */}
          <Link
            to="/inperson-start"
            className="group rounded-xl border relative overflow-hidden
                       bg-card/80 backdrop-blur-sm
                       p-4 sm:p-5 flex items-center justify-between
                       transition-all duration-200 outline-none
                       hover:-translate-y-0.5 hover:border-sky-300/50
                       hover:shadow-[0_14px_44px_-10px_rgba(120,255,200,.34)]
                       hover:bg-card
                       focus-visible:ring-2 focus-visible:ring-sky-300/60
                       focus-visible:ring-offset-[1px] focus-visible:ring-offset-background
                       active:scale-[0.99]"
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl
                            opacity-0 group-hover:opacity-90
                            transition
                            ring-0 group-hover:ring-1
                            ring-sky-300/35" />

            <div className="pointer-events-none absolute inset-0 opacity-70
                            bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(120,255,200,.14),transparent)]
                            group-hover:opacity-100 transition" />
            <div className="pointer-events-none absolute inset-0 rounded-xl
                            border border-white/10" />

            <div className="relative flex items-center gap-3 sm:gap-4">
              <ClipboardList className="opacity-90 group-hover:opacity-100 transition" />
              <div>
                <h2 className="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">
                  In-Person Inspection
                </h2>
                <p className="text-sm text-muted-foreground/95 leading-snug">
                  Guided step-by-step checks while viewing a car on site —
                  photos, condition prompts, and risk highlights.
                </p>
              </div>
            </div>

            <ShieldCheck className="relative transition group-hover:scale-105" />
          </Link>

        </div>
      </div>
    </div>
  );
}
