// src/pages/HowMuchShouldYouOfferUsedCarAustralia.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowMuchShouldYouOfferUsedCarAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "How Much Should You Offer on a Used Car in Australia? (2026 Negotiation Guide) | CarVerity",
      description:
        "Not sure how much to offer on a used car in Australia? Learn how to calculate a fair offer, assess risk, adjust for defects and negotiate confidently.",
      canonical:
        "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia#article",
          headline:
            "How Much Should You Offer on a Used Car in Australia? (2026 Negotiation Guide)",
          description:
            "A practical negotiation guide explaining how Australian buyers can calculate a fair offer when purchasing a used car.",
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
            "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
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
              name: "Used Car Negotiation Guide",
              item:
                "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
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
              How Much Should You Offer on a Used Car in Australia? (2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              One of the most common questions Australian buyers ask is:
              <strong> “How much should I offer?”</strong>
            </p>

            <p className="text-slate-400 leading-relaxed">
              Offering too low may offend the seller. Offering too high may cost
              you thousands. The right offer is not a guess — it’s calculated.
            </p>
          </header>

          {/* STEP 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Start With Market Value
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before negotiating, compare similar vehicles:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Same make and model</li>
              <li>Similar mileage</li>
              <li>Comparable condition</li>
              <li>Same state (NSW, VIC, QLD etc.)</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              This gives you a baseline range. If the asking price already sits
              below market, aggressive negotiation may be unnecessary.
            </p>
          </section>

          {/* STEP 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: Adjust for Condition
            </h2>

            <p className="text-slate-400 leading-relaxed">
              After conducting a proper inspection, adjust the offer based on:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Tyre wear</li>
              <li>Brake condition</li>
              <li>Cosmetic damage</li>
              <li>Service gaps</li>
              <li>Mechanical concerns</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Even minor issues can justify price adjustments when documented calmly.
            </p>
          </section>

          {/* STEP 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Factor in Risk
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Not all risks are visible. If service history is incomplete or the
              seller is vague, uncertainty should influence your offer.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Always run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                PPSR check
              </Link>{" "}
              before finalising numbers.
            </p>
          </section>

          {/* PRIVATE VS DEALER */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Dealer vs Private Seller Negotiation
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Private sellers are often more flexible, particularly if motivated.
              Dealers may have tighter margins but still expect negotiation.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Read our{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller comparison
              </Link>{" "}
              to understand how this impacts pricing strategy.
            </p>
          </section>

          {/* TYPICAL RANGE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What’s a Typical Negotiation Range?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              In Australia, negotiation commonly ranges between 3%–10%,
              depending on market conditions and vehicle demand.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>High-demand vehicles: smaller margin</li>
              <li>Private sales: often more flexible</li>
              <li>Vehicles with defects: larger adjustments justified</li>
            </ul>
          </section>

          {/* STRUCTURED APPROACH */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Use Structure, Not Emotion
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Emotional negotiation leads to poor decisions. Structured evaluation
              leads to fair pricing.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Review our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step inspection guide
              </Link>{" "}
              and our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car checklist
              </Link>{" "}
              before calculating your offer.
            </p>
          </section>

          {/* CTA */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you prefer a structured way to assess condition and calculate
              negotiation leverage,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity helps you document issues and position price logically
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              You can also review our{" "}
              <Link
                to="/trust"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                Trust & Transparency
              </Link>{" "}
              page to understand how the product operates.
            </p>
          </section>

        </article>
      </section>
    </div>
  );
}
