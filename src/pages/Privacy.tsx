export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        Legal
      </span>

      <h1 className="text-2xl font-semibold text-white">
        Privacy Policy
      </h1>

      <p className="text-sm text-slate-300">
        CarVerity is designed to be simple, respectful, and privacy-first.
        This page explains what information is collected and how it is used.
      </p>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Information you provide
        </h2>
        <p className="text-sm text-slate-300">
          When using CarVerity, you may capture photos, inspection notes, and
          vehicle details during an in-person inspection. By default, this
          information is stored locally on your device.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Payments
        </h2>
        <p className="text-sm text-slate-300">
          Payments are processed securely by Stripe. CarVerity does not store
          your card details. Stripe may collect and process payment information
          in accordance with their own privacy policy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Email (optional)
        </h2>
        <p className="text-sm text-slate-300">
          If you choose to link an email address (for example, to restore
          inspections across devices), your email is used only for that purpose.
          We do not sell or share email addresses.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Inspection limitations
        </h2>
        <p className="text-sm text-slate-300">
          CarVerity helps document visible observations. It does not diagnose
          mechanical faults or guarantee vehicle condition.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">
          Changes
        </h2>
        <p className="text-sm text-slate-300">
          This policy may be updated as CarVerity evolves. Any changes will be
          reflected on this page.
        </p>
      </section>

      <p className="text-xs text-slate-400">
        Last updated: {new Date().getFullYear()}
      </p>
    </div>
  );
}
