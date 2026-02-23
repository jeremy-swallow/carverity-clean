// src/pages/DealerVsPrivateSellerAustralia.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function DealerVsPrivateSellerAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "Dealer vs Private Seller: Which Is Better When Buying a Used Car in Australia? (2026 Guide) | CarVerity",
      description:
        "Should you buy a used car from a dealer or a private seller in Australia? Compare risks, legal protections, pricing differences and inspection considerations before you decide.",
      canonical:
        "https://www.carverity.com.au/dealer-vs-private-seller-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/dealer-vs-private-seller-australia#article",
          headline:
            "Dealer vs Private Seller: Which Is Better When Buying a Used Car in Australia? (2026 Guide)",
          description:
            "A practical comparison of buying a used car from a dealer versus a private seller in Australia.",
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
            "https://www.carverity.com.au/dealer-vs-private-seller-australia",
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
              name: "Dealer vs Private Seller",
              item:
                "https://www.carverity.com.au/dealer-vs-private-seller-australia",
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
              Dealer vs Private Seller: Which Is Better When Buying a Used Car in Australia? (2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              When buying a used car in Australia, one of the biggest decisions
              is whether to purchase from a licensed dealer or a private seller.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Each option has advantages, risks, and legal differences. The right
              choice depends on your budget, risk tolerance, and how confident
              you are conducting your own inspection.
            </p>
          </header>

          {/* PRICE DIFFERENCE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Price: Dealers Are Usually More Expensive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Vehicles sold by dealers typically cost more than equivalent
              private listings. This price difference often reflects:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Dealer overhead costs</li>
              <li>Compliance requirements</li>
              <li>Statutory warranty obligations (where applicable)</li>
              <li>Reconditioning and detailing</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Private sellers may offer lower prices, but the reduced cost often
              comes with fewer protections.
            </p>
          </section>

          {/* LEGAL PROTECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Legal Protections in Australia
            </h2>

            <p className="text-slate-400 leading-relaxed">
              One major difference between dealers and private sellers is legal protection.
            </p>

            <h3 className="text-lg font-semibold mt-4">Buying From a Dealer</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>May include statutory warranty (depending on age/mileage)</li>
              <li>Covered by Australian Consumer Law</li>
              <li>Clearer complaint resolution pathways</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4">Buying From a Private Seller</h3>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>No statutory warranty</li>
              <li>Limited consumer protections</li>
              <li>“Buyer beware” generally applies</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If risk reduction is your priority, dealers often provide more legal safety.
            </p>
          </section>

          {/* INSPECTION RISK */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Inspection Risk: Both Require Due Diligence
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Whether buying from a dealer or private seller, you should still:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Run a{" "}
                <Link
                  to="/ppsr-check-australia"
                  className="text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  PPSR check
                </Link>
              </li>
              <li>Conduct a structured in-person inspection</li>
              <li>Test drive thoroughly</li>
              <li>Verify service history</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Dealers are not immune to oversights, and private sellers are not
              automatically dishonest. Risk exists in both environments.
            </p>
          </section>

          {/* NEGOTIATION */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Negotiation Differences
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Private sellers may be more flexible on price, especially if they
              are motivated to sell quickly.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Dealers may negotiate, but margins are often tighter and structured.
            </p>
          </section>

          {/* WHEN TO CHOOSE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              When a Dealer May Be Better
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>You want legal protection</li>
              <li>You prefer structured paperwork</li>
              <li>You want warranty coverage</li>
              <li>You are risk-averse</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">
              When a Private Seller May Be Better
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>You are price-sensitive</li>
              <li>You are confident inspecting vehicles</li>
              <li>You are comfortable managing paperwork</li>
              <li>You accept higher risk for lower cost</li>
            </ul>
          </section>

          {/* STRUCTURE MATTERS */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Structure Reduces Risk in Both Cases
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The environment (dealer yard vs driveway) can influence pressure levels.
              A structured checklist ensures you evaluate the vehicle methodically.
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
                Australian used car checklist
              </Link>
              .
            </p>
          </section>

          {/* CTA */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you prefer a calm, structured mobile inspection flow,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step-by-step
              </Link>{" "}
              and helps you document what you observe before committing.
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
