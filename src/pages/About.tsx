// src/pages/About.tsx

import { Link } from "react-router-dom";
import { ShieldCheck, Info, Mail, MapPin } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white space-y-12">
      {/* INTRO */}
      <header className="space-y-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          CarVerity · About
        </p>

        <h1 className="text-2xl md:text-3xl font-semibold">
          About CarVerity
        </h1>

        <p className="text-slate-300 leading-relaxed">
          CarVerity is a buyer-support tool designed to help you inspect a used
          car in-person and record what you actually observe — calmly, clearly,
          and without pressure.
        </p>
      </header>

      {/* WHAT IT IS */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-slate-400 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">What CarVerity is</h2>
            <p className="text-slate-300 leading-relaxed mt-1">
              A guided inspection flow that helps you capture key photos, mark
              concerns or unknowns, and generate a structured report you can
              review later.
            </p>
          </div>
        </div>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Guided photo capture</li>
          <li>Simple tap-to-answer checks</li>
          <li>Clear summary of what you recorded</li>
          <li>Decision support that stays grounded in your inputs</li>
        </ul>
      </section>

      {/* WHAT IT IS NOT */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-slate-400 mt-0.5" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">What CarVerity is not</h2>
            <p className="text-slate-300 leading-relaxed mt-1">
              CarVerity does not diagnose mechanical faults, guarantee vehicle
              condition, or replace a professional inspection.
            </p>
          </div>
        </div>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Not a mechanic inspection</li>
          <li>Not a guarantee or certification</li>
          <li>Not a market valuation tool</li>
          <li>Not legal advice</li>
        </ul>

        <p className="text-slate-300 leading-relaxed">
          If you’re unsure about anything important, the safest option is to
          have the vehicle inspected by a qualified professional.
        </p>
      </section>

      {/* TRUST + PRIVACY */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Privacy and data</h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity is designed to stay lightweight and practical. Where
          possible, inspections are stored locally on your device unless
          otherwise stated.
        </p>

        <p className="text-slate-300 leading-relaxed">
          If you change devices, change browsers, or clear site data, saved scans
          may not appear. For important purchases, it’s a good idea to export or
          print your report after completing the inspection.
        </p>
      </section>

      {/* CONTACT */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-semibold">
                Support email
              </p>
              <p className="text-sm text-slate-300">
                <a
                  href="mailto:support@carverity.com.au"
                  className="underline"
                >
                  support@carverity.com.au
                </a>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                (Replace this with your real support email if different.)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm text-slate-200 font-semibold">Built in</p>
              <p className="text-sm text-slate-300">Australia</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-6 border-t border-white/10 flex flex-col gap-3">
        <Link to="/what-to-expect" className="text-slate-300 underline text-sm">
          ← What to expect
        </Link>

        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
