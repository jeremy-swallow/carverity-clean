export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold text-white">
        Terms & disclaimer
      </h1>

      <p className="text-sm text-slate-300 max-w-xl">
        CarVerity is designed to help buyers document and interpret what was
        visible during an in-person vehicle inspection. It is a decision-support
        tool — not a diagnostic service.
      </p>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          What CarVerity does
        </h2>

        <ul className="text-sm text-slate-300 space-y-2">
          <li>
            • Helps you record observations made during an in-person inspection
          </li>
          <li>
            • Summarises inspection completeness, confidence, and visible signals
          </li>
          <li>
            • Provides buyer-safe guidance to help inform your own decisions
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          What CarVerity does not do
        </h2>

        <ul className="text-sm text-slate-300 space-y-2">
          <li>• Diagnose mechanical or electrical faults</li>
          <li>• Guarantee vehicle condition or future performance</li>
          <li>• Replace a professional mechanical inspection</li>
          <li>• Make purchase decisions on your behalf</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          How information is used
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          CarVerity’s insights are based solely on the information you provide,
          including photos, observations, and checks that were possible at the
          time of inspection. Some vehicle issues may not be visible or
          detectable during a brief on-site review.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Responsibility and decisions
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          Any decision to proceed with or purchase a vehicle remains entirely
          your responsibility. CarVerity does not accept liability for purchase
          outcomes, negotiations, or vehicle performance after sale.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Data and testing status
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          Inspections are stored locally on your device unless otherwise stated.
          CarVerity is currently in active testing and may evolve over time as
          feedback is incorporated.
        </p>
      </section>

      <p className="text-xs text-slate-400 max-w-xl">
        By using CarVerity, you acknowledge and accept these terms.
      </p>
    </div>
  );
}
