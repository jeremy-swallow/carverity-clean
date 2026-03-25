// src/pages/UsedCarChecklistPrintable.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function UsedCarChecklistPrintable() {
  useEffect(() => {
    applySeo({
      title: "Printable Used Car Checklist Australia 2026 | CarVerity",
      description:
        "Print or save this simplified used car checklist for Australia. A practical exterior, interior and test drive checklist for buyers who want a clean, printable version.",
      canonical: "https://www.carverity.com.au/used-car-checklist-printable",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id":
            "https://www.carverity.com.au/used-car-checklist-printable#webpage",
          name: "Printable Used Car Checklist Australia 2026",
          description:
            "Print or save this simplified used car checklist for Australia. A practical exterior, interior and test drive checklist for buyers who want a clean, printable version.",
          isPartOf: {
            "@type": "WebSite",
            name: "CarVerity",
            url: "https://www.carverity.com.au/",
          },
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.carverity.com.au/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Used Car Checklist Australia",
              item: "https://www.carverity.com.au/used-car-checklist-australia",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Printable Checklist",
              item:
                "https://www.carverity.com.au/used-car-checklist-printable",
            },
          ],
        },
      ],
    });
  }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html, body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-hide {
            display: none !important;
          }

          .print-shell {
            max-width: none !important;
            padding: 0 !important;
          }

          .print-card {
            border: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          .print-text-dark {
            color: #111827 !important;
          }

          .print-text-mid {
            color: #374151 !important;
          }

          .print-text-light {
            color: #6b7280 !important;
          }

          .print-link {
            color: #111827 !important;
            text-decoration: none !important;
          }

          .print-section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-grid {
            display: block !important;
          }

          .print-grid > .print-block {
            display: block !important;
            width: 100% !important;
            margin-bottom: 10px !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #d1d5db !important;
            background: white !important;
            box-shadow: none !important;
          }

          .print-compact {
            margin-top: 10px !important;
          }

          .print-no-gap > * + * {
            margin-top: 10px !important;
          }

          .print-notes-line {
            height: 28px !important;
            border-color: #d1d5db !important;
          }

          .print-header {
            margin-bottom: 10px !important;
            padding-bottom: 10px !important;
            border-bottom: 1px solid #d1d5db !important;
          }

          .print-footer {
            margin-top: 10px !important;
            padding-top: 10px !important;
            border-top: 1px solid #d1d5db !important;
          }
        }
      `}</style>

      <section className="max-w-4xl mx-auto px-6 py-10 print-shell">
        <div className="print-hide mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Printable Used Car Checklist (Australia)
          </h1>
          <p className="mt-3 text-slate-300 leading-relaxed">
            This is the simplified print version. It is useful if you want
            something basic on paper.
          </p>
          <p className="mt-3 text-slate-300 leading-relaxed">
            For the better option while standing next to the car,{" "}
            <Link
              to="/"
              className="underline underline-offset-4 text-emerald-300 hover:text-emerald-200"
            >
              use CarVerity’s guided inspection flow
            </Link>
            . It gives you structure, photo capture, saved progress and a clear
            report at the end.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-black hover:opacity-90 transition"
            >
              Print / Save as PDF
            </button>

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/60 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-900 transition"
            >
              Start guided inspection
            </Link>

            <Link
              to="/used-car-checklist-australia"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/60 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-900 transition"
            >
              Back to full checklist page
            </Link>
          </div>
        </div>

        <article className="print-card rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10 shadow-2xl shadow-black/20">
          <header className="print-section print-header border-b border-white/10 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 print-text-light">
                  CarVerity
                </p>
                <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-white print-text-dark">
                  Used Car Checklist — Printable Version
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 print-text-mid">
                  A simple buyer-focused checklist for inspecting a used car in
                  Australia. Tick what you checked, circle concerns, and slow
                  the process down before making a decision.
                </p>
              </div>

              <div className="text-right text-xs text-slate-400 print-text-light">
                <p>Australia 2026</p>
                <p className="mt-1">carverity.com.au</p>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-6 md:grid-cols-2 print-grid">
            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                Before You Arrive
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Run a PPSR check</li>
                <li>☐ Confirm VIN and registration match</li>
                <li>☐ Ask for service history and receipts</li>
                <li>☐ Check whether recalls have been addressed</li>
                <li>☐ Decide whether you may also want a mechanic inspection</li>
              </ul>
            </div>

            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                First Walk-Around
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Check for dents and scratches</li>
                <li>☐ Look for mismatched paint</li>
                <li>☐ Check panel gaps for evenness</li>
                <li>☐ Look for rust around lower panels and wheel arches</li>
                <li>☐ Check tyres for even wear and good tread</li>
              </ul>
            </div>

            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                Interior & Electronics
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Check seat wear against age and kilometres</li>
                <li>☐ Test windows, locks and mirrors</li>
                <li>☐ Check dashboard warning lights on startup</li>
                <li>☐ Test air conditioning properly</li>
                <li>☐ Test infotainment, reverse camera and basic controls</li>
                <li>☐ Check for unusual smells or signs of water entry</li>
              </ul>
            </div>

            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                Under The Bonnet (Visual Only)
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Look for visible fluid leaks</li>
                <li>☐ Check battery terminals for corrosion</li>
                <li>☐ Inspect hoses for obvious cracks or wear</li>
                <li>☐ Be cautious if the engine bay looks freshly cleaned</li>
              </ul>
            </div>

            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                Test Drive
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Acceleration feels smooth</li>
                <li>☐ Braking feels straight and stable</li>
                <li>☐ Steering does not pull or vibrate</li>
                <li>☐ Gear changes feel smooth</li>
                <li>☐ No clunks, knocks, rattles or whining sounds</li>
                <li>☐ Car feels settled over bumps and at speed</li>
              </ul>
            </div>

            <div className="print-section print-block rounded-2xl border border-white/10 bg-slate-950/30 p-5">
              <h3 className="text-lg font-semibold text-white print-text-dark">
                After The Drive
              </h3>
              <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
                <li>☐ Check for new warning lights</li>
                <li>☐ Look under the car for leaks</li>
                <li>☐ Notice any burning smell or unusual odour</li>
                <li>☐ Do one final walk-around</li>
              </ul>
            </div>
          </section>

          <section className="mt-8 print-section print-compact rounded-2xl border border-white/10 bg-slate-950/30 p-5">
            <h3 className="text-lg font-semibold text-white print-text-dark">
              Common Red Flags
            </h3>
            <ul className="mt-4 space-y-3 text-slate-200 print-text-mid">
              <li>☐ Seller rushing you</li>
              <li>☐ Story changes during conversation</li>
              <li>☐ Inconsistent or missing history</li>
              <li>☐ Warning lights explained away casually</li>
              <li>☐ Visible issues dismissed as “nothing”</li>
              <li>☐ You feel pressured to decide quickly</li>
            </ul>
          </section>

          <section className="mt-8 print-section print-compact rounded-2xl border border-dashed border-white/15 bg-slate-950/20 p-5">
            <h3 className="text-lg font-semibold text-white print-text-dark">
              Notes
            </h3>
            <div className="mt-4 space-y-4 print-no-gap">
              <div className="print-notes-line h-10 rounded-lg border border-white/10" />
              <div className="print-notes-line h-10 rounded-lg border border-white/10" />
              <div className="print-notes-line h-10 rounded-lg border border-white/10" />
              <div className="print-notes-line h-10 rounded-lg border border-white/10" />
            </div>
          </section>

          <section className="mt-8 print-section print-compact rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <h3 className="text-lg font-semibold text-white print-text-dark">
              Better Than Paper
            </h3>
            <p className="mt-3 text-slate-200 print-text-mid leading-relaxed">
              This printable version is intentionally simple. If you want the
              stronger option, CarVerity guides you step-by-step, helps you
              capture photos, keeps your inspection structured, and turns your
              observations into a clear report you can review afterwards.
            </p>

            <div className="print-hide mt-5 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-black hover:opacity-90 transition"
              >
                Use CarVerity instead
              </Link>

              <Link
                to="/used-car-checklist-australia"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-slate-900/60 px-5 py-3 font-semibold text-slate-100 hover:bg-slate-900 transition"
              >
                View full checklist page
              </Link>
            </div>
          </section>

          <footer className="mt-8 print-footer border-t border-white/10 pt-5 text-xs text-slate-400 print-text-light">
            <p>
              Source page:{" "}
              <Link
                to="/used-car-checklist-australia"
                className="underline underline-offset-4 print-link"
              >
                carverity.com.au/used-car-checklist-australia
              </Link>
            </p>
            <p className="mt-2">
              CarVerity is a guided used car inspection app for Australian
              buyers. This printable page is a simplified companion, not the
              full guided experience.
            </p>
          </footer>
        </article>
      </section>
    </div>
  );
}