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
          Buying a used car can feel rushed, pressured, and uncertain.
          CarVerity is designed to slow things down — giving you calm,
          practical guidance while you’re standing next to the car.
        </p>
      </header>

      {/* REASSURANCE */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          A calm guide — not a judgement
        </h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity doesn’t tell you what to buy or push you toward a decision.
          It helps you notice what’s in front of you, document what you see,
          and understand how condition affects confidence and negotiation.
        </p>

        <p className="text-slate-300 leading-relaxed">
          There’s no scoring, no pressure, and no “gotcha” moments —
          just structured support while you take your time.
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What CarVerity helps with
        </h2>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Guided photo capture during an in-person inspection</li>
          <li>Documenting observations you might otherwise forget</li>
          <li>Highlighting condition-related risk and uncertainty</li>
          <li>Providing pricing confidence based on what you observed</li>
          <li>Helping you decide whether to proceed, negotiate, or walk away</li>
        </ul>
      </section>

      {/* PRICING CONTEXT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          How pricing fits in
        </h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity does not estimate what a car is worth or predict market prices.
          Instead, pricing confidence appears <strong>after</strong> your inspection,
          once you’ve noted the vehicle’s condition.
        </p>

        <p className="text-slate-300 leading-relaxed">
          Based on what you observed, CarVerity reflects whether the asking price
          feels broadly reasonable, whether there may be room to negotiate, or
          whether condition issues meaningfully weaken price confidence.
        </p>

        <p className="text-slate-300 leading-relaxed">
          This gives you practical language and context to discuss price with the
          seller — without relying on guesses or generic valuations.
        </p>
      </section>

      {/* WHAT IT DOES NOT DO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What CarVerity deliberately does not do
        </h2>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>It does not analyse online listings or seller wording</li>
          <li>It does not diagnose mechanical faults</li>
          <li>It does not predict future repairs or ownership costs</li>
          <li>It does not provide market valuations</li>
          <li>It does not pressure you to buy or negotiate</li>
        </ul>

        <p className="text-slate-300 leading-relaxed">
          Everything in CarVerity is grounded in what you actually see
          during your inspection — not assumptions or guesses.
        </p>
      </section>

      {/* HOW A SCAN FEELS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What an inspection feels like
        </h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity guides you step by step through photos and simple checks,
          using plain language and gentle prompts.
        </p>

        <p className="text-slate-300 leading-relaxed">
          You’re encouraged to pause, look closer where needed,
          and note anything that feels uncertain — without being alarmist.
        </p>

        <p className="text-slate-300 leading-relaxed">
          At the end, you’ll see a clear summary that reflects
          your observations and how they affect confidence and negotiation.
        </p>
      </section>

      {/* WHEN IT HELPS MOST */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          When CarVerity is most useful
        </h2>

        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>When you feel unsure after seeing a car in person</li>
          <li>When you want to negotiate based on condition, not instinct</li>
          <li>When deciding whether to walk away</li>
          <li>When comparing how different cars made you feel</li>
        </ul>
      </section>

      {/* WHEN NOT A FIT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          When it may not be the right fit
        </h2>

        <p className="text-slate-300 leading-relaxed">
          If you’re only looking for a fast price estimate or a simple
          “buy / don’t buy” answer, CarVerity may not suit you.
        </p>

        <p className="text-slate-300 leading-relaxed">
          It’s designed for buyers who value clarity, reflection,
          and confidence over speed.
        </p>
      </section>

      {/* FOOTER */}
      <footer className="pt-6 border-t border-white/10">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
