// src/pages/WhatToExpect.tsx

import { Link } from "react-router-dom";

export default function WhatToExpect() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white space-y-12">
      {/* INTRO */}
      <header className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold">
          What to expect when using CarVerity
        </h1>

        <p className="text-slate-300 leading-relaxed">
          Buying a used car can feel rushed, pressured, and uncertain. CarVerity
          is designed to slow things down — giving you practical, buyer-safe
          guidance while you’re standing next to the car.
        </p>
      </header>

      {/* REASSURANCE */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">A guided flow — not a judgement</h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity doesn’t tell you what to buy or push you toward a decision.
          It helps you notice what’s in front of you, document what you see, and
          understand what’s worth clarifying before you commit.
        </p>

        <p className="text-slate-300 leading-relaxed">
          No pressure and no “gotcha” moments — just structured support so you
          can make a clearer decision.
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What CarVerity helps with</h2>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Guided photo capture during an in-person inspection</li>
          <li>Simple tap-to-answer checks (no typing required)</li>
          <li>Capturing concerns, unknowns, and quick notes</li>
          <li>A structured summary of what you recorded</li>
          <li>Buyer-safe guidance to reduce regret</li>
        </ul>
      </section>

      {/* STORAGE */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Saving your inspections</h2>

        <p className="text-slate-300 leading-relaxed">
          Saved inspections are stored locally on your device unless otherwise
          stated. This helps keep the app lightweight and fast.
        </p>

        <p className="text-slate-300 leading-relaxed">
          Because storage is local, saved scans may not appear if you change
          devices, change browsers, or clear site data. If you want to keep a
          long-term copy, export or print your report when available.
        </p>
      </section>

      {/* PRICING CONTEXT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">How pricing fits in</h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity does not estimate what a car is worth or predict market
          prices. Instead, it checks whether the asking price seems aligned with
          what you recorded during the inspection.
        </p>

        <p className="text-slate-300 leading-relaxed">
          If you record multiple concerns or unknowns, the report will focus on
          what to clarify and what would make walking away reasonable.
        </p>
      </section>

      {/* WHAT IT DOES NOT DO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What CarVerity deliberately does not do
        </h2>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>It does not diagnose mechanical faults</li>
          <li>It does not guarantee vehicle condition</li>
          <li>It does not replace a professional inspection</li>
          <li>It does not provide market valuations</li>
        </ul>

        <p className="text-slate-300 leading-relaxed">
          Everything in CarVerity is grounded in what you actually observe — not
          assumptions or guesses.
        </p>
      </section>

      {/* HOW A SCAN FEELS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What an inspection feels like</h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity guides you step by step through photos and checks, using
          plain language and clear prompts.
        </p>

        <p className="text-slate-300 leading-relaxed">
          At the end, you’ll see a summary that reflects your observations, and
          how they affect confidence and decision quality.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="pt-6 border-t border-white/10 flex items-center justify-between">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>

        <Link to="/about" className="text-slate-300 underline text-sm">
          About CarVerity →
        </Link>
      </footer>
    </div>
  );
}
