// src/pages/Pricing.tsx
export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-6">
      <h1 className="text-3xl font-bold">Pricing</h1>

      <p className="text-slate-300">
        CarVerity pricing reflects the depth of analysis and inspection support
        provided at each stage.
      </p>

      {/* EXPECTATION SETTING */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3">
        <p className="text-sm text-slate-300">
          <strong>Online scans</strong> focus on listing context — highlighting
          missing details, wording risks, and seller-provided information.
        </p>

        <p className="text-sm text-slate-300">
          <strong>In-person scans</strong> include guided photo inspection,
          condition observations, and pricing confidence based on what you
          physically see.
        </p>

        <p className="text-xs text-slate-400">
          CarVerity does not provide market valuations or buying advice. It
          supports informed decisions about whether to proceed, negotiate, or
          walk away.
        </p>
      </div>

      <p className="text-slate-400 text-sm">
        Full pricing details will appear here shortly.
      </p>
    </div>
  );
}
