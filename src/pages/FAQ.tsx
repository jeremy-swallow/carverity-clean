// src/pages/FAQ.tsx

import { Link } from "react-router-dom";

export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Frequently asked questions</h1>
        <p className="text-slate-300">
          CarVerity is designed to bring clarity to used-car decisions by guiding
          you through a structured, evidence-based inspection. These answers
          explain how the product is intended to be used, where its boundaries
          are, and how to interpret what it gives you.
        </p>
        <p className="text-slate-300">
          If you want a practical checklist before you inspect, see{" "}
          <Link
            to="/what-to-check-when-buying-a-used-car-australia"
            className="underline text-emerald-300 hover:text-emerald-200"
          >
            what to check when buying a used car in Australia
          </Link>
          .
        </p>
      </header>

      {/* HOW TO USE IT WELL */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          How do I get the most out of CarVerity?
        </h2>
        <p className="text-slate-300">
          CarVerity works best when you follow the guided flow and record what
          you genuinely observe — without trying to fill gaps or reach
          conclusions early.
        </p>
        <ul className="list-disc list-inside text-slate-300 space-y-1">
          <li>Move through the scan in order, one section at a time</li>
          <li>Capture the best view you can in the situation you’re in</li>
          <li>Be comfortable marking things as unknown</li>
          <li>Use notes to record what stood out, not to over-explain</li>
        </ul>
        <p className="text-slate-300">
          You don’t need technical knowledge. The app is designed to guide your
          attention, not test your expertise.
        </p>
      </section>

      {/* EXPECTATIONS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What does CarVerity expect from me as the buyer?
        </h2>
        <p className="text-slate-300">Accuracy matters more than completeness.</p>
        <p className="text-slate-300">
          If something couldn’t be checked clearly — due to access, time,
          lighting, weather, or seller limits — marking it as unknown is the
          correct and intended response.
        </p>
        <p className="text-slate-300">
          Unchecked items are treated as questions to clarify later, not as
          automatic faults.
        </p>
      </section>

      {/* WHAT IT DOES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What problem is CarVerity designed to solve?
        </h2>
        <p className="text-slate-300">
          CarVerity exists to reduce uncertainty and buyer regret.
        </p>
        <p className="text-slate-300">
          It helps you capture evidence, surface meaningful risks, make unknowns
          explicit, and understand how what you observed affects decision
          confidence.
        </p>
      </section>

      {/* WHAT IT DOES NOT DO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What does CarVerity not do?</h2>
        <p className="text-slate-300">
          CarVerity does not diagnose mechanical faults, predict market prices,
          or make purchase decisions on your behalf.
        </p>
        <p className="text-slate-300">
          It does not replace professional inspections, roadworthiness checks,
          or independent mechanical advice.
        </p>
      </section>

      {/* UNCERTAINTY */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What if I couldn’t check everything?
        </h2>
        <p className="text-slate-300">That’s expected.</p>
        <p className="text-slate-300">
          Real-world inspections are often constrained by space, time, access,
          or seller conditions. CarVerity is designed with those realities in
          mind.
        </p>
        <p className="text-slate-300">
          Anything marked as unknown is carried through into the report as an
          explicit uncertainty — something to clarify before committing, not a
          hidden assumption.
        </p>
      </section>

      {/* NEGOTIATION */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Does CarVerity help with negotiation?
        </h2>
        <p className="text-slate-300">
          CarVerity keeps inspection insight and negotiation guidance separate.
        </p>
        <p className="text-slate-300">
          Your inspection report focuses on evidence, uncertainty, and decision
          confidence. It does not include scripts, tactics, or instructions for
          dealing with a seller.
        </p>
        <p className="text-slate-300">
          Where available, optional negotiation guidance may be offered based on
          inspection findings — intended to support clear thinking about price,
          not to pressure or confront.
        </p>
      </section>

      {/* AI */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Is AI used in CarVerity?</h2>
        <p className="text-slate-300">
          Yes. CarVerity uses software models to help interpret patterns in what
          you record.
        </p>
        <p className="text-slate-300">
          The system does not diagnose vehicles or infer conditions beyond the
          information you provide. It weighs your observations, photos, and
          declared unknowns to surface risk and confidence.
        </p>
        <p className="text-slate-300">
          In all cases, the output is grounded in your inputs — not automated
          assumptions.
        </p>
      </section>

      {/* ACCOUNT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Do I need an account to use CarVerity?
        </h2>
        <p className="text-slate-300">
          Yes. You need to be signed in to run scans and save results.
        </p>
        <p className="text-slate-300">
          This ensures inspection data is associated with you and handled
          consistently as the product evolves.
        </p>
      </section>

      {/* WHEN IT MAY NOT FIT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          When might CarVerity not be the right fit?
        </h2>
        <p className="text-slate-300">
          If you’re looking for instant price predictions or automated buying
          recommendations, CarVerity may not be the right tool.
        </p>
        <p className="text-slate-300">
          It’s built for buyers who value clarity, evidence, and confidence —
          even when that leads to caution.
        </p>
      </section>

      <footer className="pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400">
          CarVerity supports informed decisions. It does not replace professional
          inspections or financial advice.
        </p>
      </footer>
    </div>
  );
}
