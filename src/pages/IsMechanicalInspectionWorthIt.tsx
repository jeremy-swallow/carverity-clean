// src/pages/IsMechanicalInspectionWorthIt.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function IsMechanicalInspectionWorthIt() {
  useEffect(() => {
    applySeo({
      title:
        "Is a Mechanical Inspection Worth It When Buying a Used Car in Australia? (2026 Guide) | CarVerity",
      description:
        "Should you pay for a mechanical inspection before buying a used car in Australia? Learn when it’s worth it, what it covers, what it doesn’t, and how to reduce risk as a buyer.",
      canonical:
        "https://www.carverity.com.au/is-a-mechanical-inspection-worth-it-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/is-a-mechanical-inspection-worth-it-australia#article",
          headline:
            "Is a Mechanical Inspection Worth It When Buying a Used Car in Australia? (2026 Guide)",
          description:
            "A practical guide explaining when a mechanical inspection is worth the cost for Australian used car buyers.",
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
          mainEntityOfPage:
            "https://www.carverity.com.au/is-a-mechanical-inspection-worth-it-australia",
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
              name: "Mechanical Inspection Guide",
              item:
                "https://www.carverity.com.au/is-a-mechanical-inspection-worth-it-australia",
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
              Is a Mechanical Inspection Worth It When Buying a Used Car in Australia? (2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Many Australian buyers wonder whether paying for a mechanical inspection
              before purchasing a used car is worth the cost.
            </p>

            <p className="text-slate-400 leading-relaxed">
              The short answer: sometimes yes — but not always.
              It depends on the vehicle, the seller, the price, and your tolerance for risk.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A mechanical inspection should be viewed as one layer in a broader,
              structured risk-reduction strategy.
            </p>
          </header>

          {/* WHAT IS IT */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What Is a Mechanical Inspection?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A mechanical inspection is typically conducted by a qualified mechanic
              who evaluates the vehicle’s mechanical condition. This may include:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Engine condition</li>
              <li>Transmission performance</li>
              <li>Brake and suspension components</li>
              <li>Cooling system</li>
              <li>Diagnostic scan for fault codes</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Costs in Australia usually range between $200 and $400,
              depending on location and depth of inspection.
            </p>
          </section>

          {/* WHEN WORTH IT */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              When a Mechanical Inspection Is Worth It
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>The vehicle is high value ($20,000+)</li>
              <li>The car is older or high mileage</li>
              <li>The service history is incomplete</li>
              <li>You lack confidence in your own inspection ability</li>
              <li>You notice concerning signs during your test drive</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              In these cases, the inspection fee can be cheap insurance
              compared to a $3,000–$8,000 repair bill.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Before committing to a mechanic, ensure you have completed a{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                structured in-person inspection
              </Link>
              .
            </p>
          </section>

          {/* WHEN MAY NOT */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              When It May Not Be Necessary
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>The vehicle is low value and priced accordingly</li>
              <li>It has full documented service history</li>
              <li>It is still under manufacturer warranty</li>
              <li>You are purchasing from a reputable dealer with statutory protections</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              In these situations, a mechanical inspection may offer diminishing returns.
            </p>

            <p className="text-slate-400 leading-relaxed">
              See our{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller comparison
              </Link>{" "}
              to better understand protection differences in Australia.
            </p>
          </section>

          {/* WHAT IT DOES NOT DO */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What a Mechanical Inspection Does NOT Protect You From
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A mechanical inspection does not:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Guarantee future reliability</li>
              <li>Prevent hidden intermittent faults</li>
              <li>Replace a finance or written-off check</li>
              <li>Protect against seller misrepresentation</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Always run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                PPSR check in Australia
              </Link>{" "}
              before purchasing.
            </p>
          </section>

          {/* STRUCTURED APPROACH */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Mechanical Inspection vs Structured Self-Inspection
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Many buyers skip structured self-inspection and rely entirely on
              a mechanic. That can be a mistake.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structured in-person inspection helps you:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Identify inconsistencies in seller behaviour</li>
              <li>Notice cosmetic accident repairs</li>
              <li>Test electronics thoroughly</li>
              <li>Document concerns before negotiation</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              For a complete inspection framework, review our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete Australian used car checklist
              </Link>
              .
            </p>
          </section>

          {/* BALANCED APPROACH */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              The Balanced Approach
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The safest strategy for higher-value purchases is layered protection:
            </p>

            <ol className="list-decimal pl-6 space-y-2 text-slate-300">
              <li>Run a PPSR check</li>
              <li>Conduct a structured in-person inspection</li>
              <li>Test drive thoroughly</li>
              <li>Calculate a logical offer</li>
              <li>Then consider a mechanical inspection if risk remains</li>
            </ol>

            <p className="text-slate-400 leading-relaxed">
              Layered protection reduces risk far more effectively than relying
              on one single step.
            </p>

            <p className="text-slate-400 leading-relaxed">
              See our{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car negotiation guide for Australia
              </Link>{" "}
              to understand how inspection findings influence price.
            </p>
          </section>

          {/* CLUSTER DISTRIBUTION */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you prefer a structured mobile inspection flow,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step-by-step
              </Link>{" "}
              and helps you document what you observe before committing.
            </p>

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related used car buying guides (Australia):
              </p>
              <p>
                <Link to="/ppsr-check-australia" className="underline hover:text-white">
                  PPSR check
                </Link>{" · "}
                <Link to="/how-to-inspect-a-used-car-in-person" className="underline hover:text-white">
                  Inspect in person
                </Link>{" · "}
                <Link to="/what-to-check-when-buying-a-used-car-australia" className="underline hover:text-white">
                  Used car checklist
                </Link>{" · "}
                <Link to="/how-much-should-you-offer-used-car-australia" className="underline hover:text-white">
                  Negotiation guide
                </Link>{" · "}
                <Link to="/dealer-vs-private-seller-australia" className="underline hover:text-white">
                  Dealer vs private seller
                </Link>{" · "}
                <Link to="/used-car-inspection-mistakes-australia" className="underline hover:text-white">
                  Inspection mistakes
                </Link>
              </p>
            </div>
          </section>

        </article>
      </section>
    </div>
  );
}