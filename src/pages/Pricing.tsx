export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="text-slate-300">
          Simple, scan-based pricing with no subscriptions or lock-in.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How pricing works</h2>
        <p className="text-slate-300">
          CarVerity uses scan credits. A credit is used when you run a scan,
          such as analysing an online listing or completing an in-person
          inspection summary.
        </p>
        <p className="text-slate-300">
          There are no subscriptions. You only pay for scans you choose to run.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">When credits are used</h2>
        <ul className="text-slate-300 list-disc list-inside space-y-1">
          <li>Running an online listing scan</li>
          <li>Completing an in-person inspection summary</li>
        </ul>
        <p className="text-slate-300">
          Reviewing previous scans, viewing results, and reading guidance does
          not consume additional credits.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Saving and continuing scans</h2>
        <p className="text-slate-300">
          You can start using CarVerity without an account. An email address is
          only required when you want to save a scan, continue it on another
          device, or access it later.
        </p>
        <p className="text-slate-300">
          Once saved, your scans are tied to your email and can be accessed
          across devices.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What happens to your data</h2>
        <p className="text-slate-300">
          Your scans belong to you. CarVerity does not sell scan data to sellers,
          dealers, or listing platforms.
        </p>
        <p className="text-slate-300">
          You can export or print your results at any time for your own records.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">When pricing may not be right</h2>
        <p className="text-slate-300">
          If you are only looking for a market price estimate or a quick deal
          comparison, CarVerity may not be the right fit. It is designed for
          buyers who want condition-based context and decision support.
        </p>
      </section>
    </div>
  );
}
