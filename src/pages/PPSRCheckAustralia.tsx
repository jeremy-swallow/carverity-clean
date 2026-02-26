// src/pages/PPSRCheckAustralia.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function PPSRCheckAustralia() {
  useEffect(() => {
    applySeo({
      title: "What Is a PPSR Check? (Australia Guide 2026) | CarVerity",
      description:
        "Learn what a PPSR check is in Australia, why it matters when buying a used car, how to run one, and what risks it protects you from.",
      canonical: "https://www.carverity.com.au/ppsr-check-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": "https://www.carverity.com.au/ppsr-check-australia#article",
          headline: "What Is a PPSR Check? (Australia Guide 2026)",
          description:
            "A complete guide explaining what a PPSR check is, how it works in Australia, and why every used car buyer should run one before purchasing.",
          author: {
            "@type": "Organization",
            name: "CarVerity",
          },
          publisher: {
            "@type": "Organization",
            name: "CarVerity",
            logo: {
              "@type": "ImageObject",
              url: "https://www.carverity.com.au/og-image.png",
            },
          },
          mainEntityOfPage: "https://www.carverity.com.au/ppsr-check-australia",
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
              name: "PPSR Check",
              item: "https://www.carverity.com.au/ppsr-check-australia",
            },
          ],
        },
      ],
    });
  }, []);

  return (
    <div className="text-white">
      <section className="max-w-3xl mx-auto px-6 py-16">
        <article className="space-y-12">
          <header className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              What Is a PPSR Check? (Australia 2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check in Australia is one of the most important steps when
              buying a used car. It confirms whether a vehicle has money owing,
              has been written off, or has been reported stolen.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Skipping this step can expose you to serious financial risk. This
              guide explains what a PPSR check is, why it matters, and how to
              use it properly before purchasing a second-hand vehicle.
            </p>
          </header>

          {/* WHAT IS PPSR */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What Does PPSR Stand For?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              PPSR stands for the Personal Property Securities Register. It is
              the official Australian government register that records security
              interests over personal property, including vehicles.
            </p>

            <p className="text-slate-400 leading-relaxed">
              When a car is financed, the lender records an interest on the
              PPSR. If the loan is unpaid, the lender may still have legal
              rights over the vehicle — even if it’s sold to you.
            </p>
          </section>

          {/* WHY IT MATTERS */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Is a PPSR Check Important?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              If you buy a car that still has finance owing, the lender may
              repossess it. A PPSR check protects you from this scenario and
              provides written confirmation of the vehicle’s financial status.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Confirms whether finance is owing</li>
              <li>Identifies written-off vehicles</li>
              <li>Shows whether the vehicle has been reported stolen</li>
              <li>Provides official confirmation for your records</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check reduces financial risk — but it does not assess
              condition or mechanical health.
            </p>
          </section>

          {/* HOW TO RUN */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              How To Run a PPSR Check in Australia
            </h2>

            <p className="text-slate-400 leading-relaxed">
              You can complete a PPSR check online using the vehicle’s VIN
              (Vehicle Identification Number). The process takes only a few
              minutes.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Always ensure the VIN you use matches the vehicle’s compliance
              plate and registration documents.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are unsure how to confirm VIN consistency during an
              inspection, review our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step used car inspection guide
              </Link>.
            </p>
          </section>

          {/* WHAT IT DOES NOT DO */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What a PPSR Check Does Not Do
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check does not confirm mechanical condition, service
              history, accident repairs, or cosmetic quality.
            </p>

            <p className="text-slate-400 leading-relaxed">
              It only verifies financial and registration status. You still
              need to conduct a proper in-person inspection and decide whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it
              </Link>{" "}
              based on the vehicle’s risk profile.
            </p>
          </section>

          {/* COMBINE WITH INSPECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Combine a PPSR Check With a Proper Inspection
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Running a PPSR check protects you financially. A structured
              inspection protects you mechanically and practically.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Before purchasing, review our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete Australian used car checklist
              </Link>{" "}
              and our{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                common used car inspection mistakes guide
              </Link>.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are comparing seller types, read our breakdown of{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>{" "}
              to understand differences in risk.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Once you’ve assessed risk, you may also want guidance on{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car
              </Link>{" "}
              based on condition and uncertainty.
            </p>
          </section>

          {/* CTA + CLUSTER DISTRIBUTION */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you want a calm, structured way to inspect a used car in person,
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition ml-1"
              >
                CarVerity guides you step-by-step
              </Link>{" "}
              and turns your observations into a clear buyer-focused report.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Want to understand the boundaries of what CarVerity does (and does
              not do)? See{" "}
              <Link
                to="/trust"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                Trust & Transparency
              </Link>
              .
            </p>

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related used car buying guides (Australia):
              </p>
              <p>
                <Link to="/what-to-check-when-buying-a-used-car-australia" className="underline hover:text-white">
                  Used car checklist
                </Link>{" · "}
                <Link to="/how-to-inspect-a-used-car-in-person" className="underline hover:text-white">
                  Inspect in person
                </Link>{" · "}
                <Link to="/used-car-inspection-mistakes-australia" className="underline hover:text-white">
                  Inspection mistakes
                </Link>{" · "}
                <Link to="/is-a-mechanical-inspection-worth-it-australia" className="underline hover:text-white">
                  Mechanical inspection worth it?
                </Link>{" · "}
                <Link to="/dealer-vs-private-seller-australia" className="underline hover:text-white">
                  Dealer vs private seller
                </Link>{" · "}
                <Link to="/how-much-should-you-offer-used-car-australia" className="underline hover:text-white">
                  How much to offer?
                </Link>
              </p>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}