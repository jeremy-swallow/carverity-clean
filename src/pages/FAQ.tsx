export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-slate-300">
          Clear answers to common questions about how CarVerity works — and what it
          does not do.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Is CarVerity a price valuation tool?
        </h2>
        <p className="text-slate-300">
          No. CarVerity does not provide market valuations or predict what a vehicle
          should sell for. It focuses on condition-based risk and pricing confidence
          derived from inspection context.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Does CarVerity tell me whether to buy a car?
        </h2>
        <p className="text-slate-300">
          No. CarVerity is designed to support your decision-making by providing
          structured context. The final decision always remains yours.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          How accurate are CarVerity’s results?
        </h2>
        <p className="text-slate-300">
          CarVerity is only as accurate as the information available. Online scans
          rely on seller-provided listing details, while in-person scans reflect what
          you observe and record during an inspection.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          Is CarVerity independent of sellers or dealers?
        </h2>
        <p className="text-slate-300">
          Yes. CarVerity does not receive incentives from sellers, dealers, or listing
          platforms. It is designed to support buyers only.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          What’s the difference between online and in-person scans?
        </h2>
        <p className="text-slate-300">
          Online scans analyse listing information, wording, and missing details.
          In-person scans help structure what you observe when physically viewing a
          vehicle.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          When is CarVerity most useful?
        </h2>
        <p className="text-slate-300">
          CarVerity is most useful when you are comparing vehicles, feeling uncertain
          after an inspection, preparing to negotiate, or deciding whether to walk
          away.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">
          When might CarVerity not be the right fit?
        </h2>
        <p className="text-slate-300">
          If you are only looking for a market price estimate or a quick deal
          comparison, CarVerity may not be the right tool. It is designed for buyers
          who value clarity over speed.
        </p>
      </section>
    </div>
  );
}
