// src/pages/Pricing.tsx
export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <p className="text-slate-300">
          CarVerity is designed to support careful used-car decisions. Pricing
          reflects the depth of context and inspection support provided at each
          stage.
        </p>
      </header>

      {/* ONLINE SCAN */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 space-y-2">
        <h2 className="text-lg font-semibold">Online listing scan</h2>
        <p className="text-slate-300">
          Analyse a vehicle listing for missing details, wording risks, and seller
          transparency.
        </p>

        <p className="text-slate-300">
          <strong>Introductory price:</strong> $4.99 AUD
        </p>

        <p className="text-xs text-slate-400">
          Online scans focus on listing context only. Photos are automatically
          extracted from the listing — no uploads or physical inspection.
        </p>
      </section>

      {/* IN-PERSON */}
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 space-y-2">
        <h2 className="text-lg font-semibold">In-person inspection scan</h2>
        <p className="text-slate-300">
          Guided photo inspection with condition observations, pricing confidence,
          and buyer-risk context.
        </p>

        <p className="text-slate-300">
          <strong>Introductory price:</strong> $14.99 AUD
        </p>

        <p className="text-xs text-slate-400">
          Includes up to 15 guided inspection photos and condition-aware pricing
          insight based on what you physically observe.
        </p>
      </section>

      {/* CONTINUATION */}
      <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-6 space-y-2">
        <h2 className="text-lg font-semibold text-emerald-200">
          Online → In-person continuation
        </h2>
        <p className="text-slate-200">
          If you’ve already completed an online scan for a vehicle, continue to an
          in-person inspection at a reduced price.
        </p>

        <p className="text-slate-200 font-semibold">
          Continuation price: $9.99 AUD
        </p>

        <p className="text-xs text-slate-400">
          Designed to support safer decisions without paying twice for the same
          context.
        </p>
      </section>

      <footer className="pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400">
          CarVerity does not provide market valuations or buying advice. It supports
          informed decisions about whether to proceed, negotiate, or walk away.
        </p>
      </footer>
    </div>
  );
}
