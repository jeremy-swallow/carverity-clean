// src/pages/TestingExpectations.tsx

import { Link } from "react-router-dom";
import {
  Beaker,
  Eye,
  ClipboardCheck,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

export default function TestingExpectations() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-white space-y-14">
      {/* Header */}
      <header className="space-y-4">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
          <Beaker className="h-4 w-4" />
          Private testing
        </span>

        <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
          What to expect as a CarVerity tester
        </h1>

        <p className="text-slate-300 leading-relaxed">
          Thank you for helping test CarVerity. This phase is about validating
          how the product <em>feels</em> to use — not about perfection.
        </p>
      </header>

      {/* Purpose */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-slate-300" />
          What we’re testing
        </h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity is designed to guide buyers calmly through an in-person car
          inspection, helping them notice, record, and reflect — without
          pressure or judgement.
        </p>

        <ul className="list-disc list-inside text-slate-300 space-y-1">
          <li>Does the flow feel clear and supportive?</li>
          <li>Do the prompts make sense while standing next to a car?</li>
          <li>Does the final guidance reduce uncertainty?</li>
        </ul>
      </section>

      {/* What to do */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-slate-300" />
          How to test
        </h2>

        <p className="text-slate-300 leading-relaxed">
          You don’t need to do anything special. Just use CarVerity naturally.
        </p>

        <ul className="list-disc list-inside text-slate-300 space-y-1">
          <li>Try a real inspection if possible</li>
          <li>Answer honestly — including “unsure” where relevant</li>
          <li>Pay attention to moments that feel confusing or reassuring</li>
        </ul>
      </section>

      {/* Feedback */}
      <section className="space-y-4 rounded-2xl border border-white/15 bg-slate-900/70 px-5 py-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-slate-300" />
          How to send feedback
        </h2>

        <p className="text-slate-300 leading-relaxed">
          The most helpful feedback is short, honest, and experience-based.
        </p>

        <div className="space-y-2 text-slate-300">
          <p>
            Please email feedback to:
            <br />
            <a
              href="mailto:support@carverity.com.au?subject=CarVerity testing feedback"
              className="underline text-white font-semibold"
            >
              support@carverity.com.au
            </a>
          </p>

          <p className="text-sm text-slate-400">
            Screenshots help, but are not required.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            Helpful prompt:
            <br />
            “I was trying to ___ and felt unsure when ___.  
            The part that helped most was ___.  
            One thing I’d change is ___.”
          </p>
        </div>
      </section>

      {/* Reassurance */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-300" />
          A quick reassurance
        </h2>

        <p className="text-slate-300 leading-relaxed">
          CarVerity does not diagnose vehicles, estimate market value, or replace
          professional inspections. Everything is grounded in what you actually
          observe.
        </p>

        <p className="text-slate-300 leading-relaxed">
          There are no right or wrong answers — uncertainty is valid and expected.
        </p>
      </section>

      {/* Footer */}
      <footer className="pt-6 border-t border-white/10 flex items-center justify-between">
        <Link to="/" className="text-slate-300 underline text-sm">
          ← Back to home
        </Link>

        <Link to="/start" className="text-slate-300 underline text-sm">
          Start a scan →
        </Link>
      </footer>
    </div>
  );
}
