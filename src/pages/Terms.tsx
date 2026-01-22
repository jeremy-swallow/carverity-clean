// src/pages/Terms.tsx

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <h1 className="text-2xl md:text-3xl font-semibold text-white">
        Terms &amp; Conditions
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
          Credits, service delivery &amp; technical issues (Australia)
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          CarVerity uses a credit system. Credits are used when report generation
          begins (not when you start an inspection).
        </p>

        <p className="text-sm text-slate-300 max-w-xl">
          In the unlikely event a technical issue occurs where a credit is used
          but your report is not delivered, we will generally resolve this by
          restoring the relevant credits to your account so you can generate the
          report again.
        </p>

        <p className="text-sm text-slate-300 max-w-xl">
          Refunds are not offered for change of mind. If we are unable to
          provide the service after reasonable attempts to resolve the issue, a
          refund may be provided in line with Australian Consumer Law.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Data storage (important)
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          Unless otherwise stated, CarVerity stores saved inspections locally on
          your device (for example, in your browser storage). This means:
        </p>

        <ul className="text-sm text-slate-300 space-y-2">
          <li>
            • Saved inspections may not be available if you change devices,
            switch browsers, or clear site data
          </li>
          <li>
            • CarVerity may not be able to restore saved scans if your device is
            lost, reset, or wiped
          </li>
        </ul>

        <p className="text-sm text-slate-300 max-w-xl">
          If you want to keep a long-term copy of your results, you should
          export or print your report when available.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Testing status
        </h2>

        <p className="text-sm text-slate-300 max-w-xl">
          CarVerity is currently in active testing and may evolve over time as
          feedback is incorporated. Features, scoring logic, and report outputs
          may change.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Contact</h2>

        <p className="text-sm text-slate-300 max-w-xl">
          If you have questions about these terms, contact{" "}
          <a
            href="mailto:support@carverity.com.au"
            className="underline text-slate-200 hover:text-white"
          >
            support@carverity.com.au
          </a>
          .
        </p>
      </section>

      <p className="text-xs text-slate-400 max-w-xl">
        By using CarVerity, you acknowledge and accept these terms.
      </p>
    </div>
  );
}
