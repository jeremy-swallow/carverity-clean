// src/pages/About.tsx

import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  ShieldCheck,
  ClipboardCheck,
  Camera,
  MapPin,
  Info,
  Mail,
} from "lucide-react";
import { applySeo } from "../utils/seo";

export default function About() {
  // SEO: route-level title/description/canonical + business identity structured data
  useEffect(() => {
    applySeo({
      title: "About CarVerity | Australian Used Car Inspection App",
      description:
        "Learn about CarVerity — an Australian used car inspection web app built to help everyday buyers follow a calm, structured in-person checklist and generate a clear, shareable report. ABN 44 861 824 638.",
      canonical: "https://www.carverity.com.au/about",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "About CarVerity",
          url: "https://www.carverity.com.au/about",
          isPartOf: {
            "@type": "WebSite",
            name: "CarVerity",
            url: "https://www.carverity.com.au",
          },
          about: {
            "@type": "Organization",
            name: "CarVerity",
            url: "https://www.carverity.com.au",
            identifier: {
              "@type": "PropertyValue",
              propertyID: "ABN",
              value: "44 861 824 638",
            },
            areaServed: "Australia",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "CarVerity",
          url: "https://www.carverity.com.au",
          identifier: {
            "@type": "PropertyValue",
            propertyID: "ABN",
            value: "44 861 824 638",
          },
          areaServed: "Australia",
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@carverity.com.au",
              availableLanguage: ["en-AU", "en"],
            },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "CarVerity",
          url: "https://www.carverity.com.au",
          areaServed: "Australia",
          identifier: {
            "@type": "PropertyValue",
            propertyID: "ABN",
            value: "44 861 824 638",
          },
        },
      ],
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white space-y-12">
      {/* INTRO */}
      <header className="space-y-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          CarVerity · About
        </p>

        <h1 className="text-2xl md:text-3xl font-semibold">About CarVerity</h1>

        <p className="text-slate-300 leading-relaxed">
          CarVerity helps everyday buyers inspect a used car in-person and
          produce a clear, shareable report — so you can slow down, stay focused,
          and make a decision based on what you actually observed.
        </p>

        <p className="text-slate-400 leading-relaxed text-sm">
          It’s designed for real inspections (dealership or private sale), and
          focuses on documenting what you can see, check, and verify on the spot.
        </p>
      </header>

      {/* TRUST STRIP */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Built for buyers</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Clear guidance that reduces pressure and regret.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex items-start gap-3">
            <Camera className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Evidence-based</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Your report reflects your photos and notes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">
                Structured outcome
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Clear summary of concerns and unknowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Our mission</h2>

        <p className="text-slate-300 leading-relaxed">
          Australia’s used car market can be fast-moving and stressful. CarVerity
          exists to eliminate the guesswork during an inspection — helping you
          spot red flags, record them properly, and make a safer decision with
          less uncertainty.
        </p>
      </section>

      {/* WHAT IT IS / ISN'T */}
      <section className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-slate-300 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">What CarVerity is</h2>
              <ul className="mt-3 text-slate-300 list-disc list-inside space-y-1">
                <li>A guided in-person inspection flow</li>
                <li>Photo capture + simple tap-to-answer checks</li>
                <li>A structured report you can save, share, or print</li>
                <li>
                  Decision support based on your recorded concerns and unknowns
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-300 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                What CarVerity deliberately does not do
              </h2>
              <ul className="mt-3 text-slate-300 list-disc list-inside space-y-1">
                <li>It does not diagnose mechanical faults</li>
                <li>It does not guarantee vehicle condition</li>
                <li>It does not replace a professional inspection</li>
                <li>It is not a government vehicle history database</li>
              </ul>

              <p className="text-slate-300 leading-relaxed mt-3">
                If you want extra peace of mind before buying, we recommend doing
                a separate PPSR check as part of your purchase process.
              </p>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                CarVerity does not provide PPSR results inside the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AUSTRALIA */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Built for Australia</h2>

        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <MapPin className="h-5 w-5 text-emerald-400 mt-0.5" />
          <div className="min-w-0">
            <p className="text-slate-300 leading-relaxed">
              CarVerity is designed specifically for Australian used-car buyers,
              with a practical inspection style that fits how people actually
              buy cars here — private sale, dealership, and everything in
              between.
            </p>
          </div>
        </div>
      </section>

      {/* BUSINESS INFORMATION */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Business information</h2>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <p className="text-slate-300 leading-relaxed">
            Australian Business Number (ABN):{" "}
            <span className="text-slate-200">44 861 824 638</span>
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Contact</h2>

        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-slate-300 mt-0.5" />
            <div className="min-w-0">
              <p className="text-slate-300 leading-relaxed">
                Questions, feedback, or a feature request?
              </p>

              <p className="text-slate-300 leading-relaxed mt-2">
                Email:{" "}
                <a
                  href="mailto:support@carverity.com.au"
                  className="underline text-slate-200"
                >
                  support@carverity.com.au
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LINKS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Helpful links</h2>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/what-to-expect"
            className="text-xs px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300 hover:bg-white/5 transition"
          >
            What to expect
          </Link>

          <Link
            to="/faq"
            className="text-xs px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300 hover:bg-white/5 transition"
          >
            FAQ
          </Link>

          <Link
            to="/privacy"
            className="text-xs px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300 hover:bg-white/5 transition"
          >
            Privacy
          </Link>

          <Link
            to="/terms"
            className="text-xs px-3 py-1 rounded-full border border-white/10 bg-slate-900/40 text-slate-300 hover:bg-white/5 transition"
          >
            Terms
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-6 border-t border-white/10 flex items-center justify-between">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>

        <Link to="/what-to-expect" className="text-slate-300 underline text-sm">
          What to expect →
        </Link>
      </footer>
    </div>
  );
}
