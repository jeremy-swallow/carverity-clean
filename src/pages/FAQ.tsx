// src/pages/FAQ.tsx

export default function FAQ() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-white space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Frequently asked questions</h1>
        <p className="text-slate-300">
          CarVerity is designed to support careful used-car decisions. These
          answers explain what the app does, how scans are saved, and what you
          can expect when using it.
        </p>
      </header>

      {/* WHAT IT DOES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What does CarVerity do?</h2>
        <p className="text-slate-300">
          CarVerity helps you assess used vehicles by providing condition-based
          context. It highlights missing information, inspection findings, and
          how those observations affect pricing confidence.
        </p>
        <p className="text-slate-300">
          The goal is to help you decide whether to proceed, negotiate, or walk
          away — not to tell you what to buy.
        </p>
      </section>

      {/* WHAT IT DOES NOT DO */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What does CarVerity not do?</h2>
        <p className="text-slate-300">
          CarVerity does not provide market valuations, price predictions, or
          buying recommendations. It does not diagnose mechanical faults or
          replace a professional inspection.
        </p>
        <p className="text-slate-300">
          All insights are based on listing information and user-observed
          condition only.
        </p>
      </section>

      {/* ONLINE VS IN-PERSON */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          What’s the difference between online and in-person scans?
        </h2>
        <p className="text-slate-300">
          <strong>Online scans</strong> analyse a vehicle listing. They highlight
          missing details, wording risks, and seller-provided information. Photos
          are extracted from the listing only.
        </p>
        <p className="text-slate-300">
          <strong>In-person scans</strong> guide you through a physical
          inspection. You capture photos, note observations, and receive
          condition-aware pricing confidence based on what you actually see.
        </p>
      </section>

      {/* SAVING SCANS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">How are my scans saved?</h2>
        <p className="text-slate-300">
          By default, scans are saved locally on the device you’re using. This
          lets you explore the app without creating an account.
        </p>
        <p className="text-slate-300">
          If you want access to your scans across devices, or if you complete a
          paid scan, you’ll be asked to save the scan to your email.
        </p>
      </section>

      {/* EMAIL */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Why does CarVerity ask for my email?</h2>
        <p className="text-slate-300">
          Your email is used to link scans to you, not to a single device. This
          allows you to:
        </p>
        <ul className="list-disc list-inside text-slate-300 space-y-1">
          <li>Access scans on another device</li>
          <li>Recover scans if your browser data is cleared</li>
          <li>Ensure paid scans remain available to you</li>
        </ul>
        <p className="text-slate-300">
          CarVerity uses password-free access. You’ll receive secure links by
          email — no passwords to remember.
        </p>
      </section>

      {/* DATA & PRIVACY */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What happens to my data?</h2>
        <p className="text-slate-300">
          Your scan data belongs to you. It is used only to provide the scan
          results and access you request.
        </p>
        <p className="text-slate-300">
          CarVerity does not sell scan data and does not use it for advertising
          or profiling.
        </p>
      </section>

      {/* WHEN IT MAY NOT FIT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          When might CarVerity not be the right fit?
        </h2>
        <p className="text-slate-300">
          If you’re only looking for a quick market price estimate or a ranked
          list of deals, CarVerity may not be the right tool.
        </p>
        <p className="text-slate-300">
          It’s designed for buyers who value clarity, evidence, and decision
          confidence over speed.
        </p>
      </section>

      <footer className="pt-6 border-t border-white/10">
        <p className="text-xs text-slate-400">
          CarVerity supports informed decisions — it does not replace professional
          inspections or financial advice.
        </p>
      </footer>
    </div>
  );
}
