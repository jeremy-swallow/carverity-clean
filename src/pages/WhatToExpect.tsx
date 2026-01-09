// src/pages/WhatToExpect.tsx
import { Link } from "react-router-dom";

export default function WhatToExpect() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl md:text-3xl font-semibold">
          What to expect when using CarVerity
        </h1>
        <p className="text-slate-300">
          CarVerity is designed to support careful used-car decisions by providing
          condition-based context — not pressure, predictions, or sales guidance.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What CarVerity helps with</h2>
        <p className="text-slate-300">
          CarVerity helps you understand inspection findings, condition-based risk,
          and pricing confidence when assessing a used car. The goal is to support
          informed decisions about whether to proceed, negotiate, or move on.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What CarVerity does not do</h2>
        <p className="text-slate-300">
          CarVerity does not provide market valuations, price predictions, or seller
          incentives. It does not rank vehicles or tell you what to buy. All guidance
          is based on observed condition and inspection context.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What happens when you run a scan</h2>
        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>You review an online listing or inspect a vehicle in person</li>
          <li>CarVerity highlights missing details, condition signals, and risks</li>
          <li>Pricing confidence and buyer context are presented</li>
          <li>You decide the next step based on that context</li>
        </ul>
      </section>

      {/* NEW — visual reassurance section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What you’ll see during a scan</h2>

        <img
          src="/what-to-expect/scan-examples.png"
          alt="Examples of online listing context and in-person inspection summaries"
          className="w-full rounded-xl border border-white/10"
        />

        <p className="text-xs text-slate-400">
          Illustrative examples of how CarVerity presents online listing context and
          in-person inspection summaries. Actual content varies depending on the
          information available.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">When CarVerity is most useful</h2>
        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Comparing multiple vehicles</li>
          <li>Feeling uncertain after a test drive or inspection</li>
          <li>Preparing to negotiate based on condition findings</li>
          <li>Deciding whether to walk away from a vehicle</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">When it may not be the right fit</h2>
        <p className="text-slate-300">
          If you are only looking for a market price estimate or a quick deal
          comparison, CarVerity may not be the right tool. It is designed for
          buyers who value clarity over speed.
        </p>
      </section>

      <footer className="pt-6 border-t border-white/10">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
