// src/pages/UsedCarGuide.tsx

import { useEffect } from "react";
import { applySeo } from "../utils/seo";
import { Link } from "react-router-dom";

export default function UsedCarGuide() {
  useEffect(() => {
    applySeo({
      title:
        "What To Check When Buying A Used Car In Australia (2026 Guide)",
      description:
        "A complete 2026 used car inspection checklist for Australian buyers. Learn exactly what to check before buying a second-hand car, including PPSR checks, exterior inspection, test drive tips, and common red flags.",
      canonical:
        "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia#article",
          headline:
            "What To Check When Buying A Used Car In Australia (2026 Guide)",
          description:
            "A complete 2026 used car inspection checklist for Australian buyers.",
          author: {
            "@type": "Organization",
            name: "CarVerity"
          },
          publisher: {
            "@type": "Organization",
            name: "CarVerity",
            logo: {
              "@type": "ImageObject",
              url: "https://www.carverity.com.au/og-image.png"
            }
          },
          mainEntityOfPage:
            "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia",
          inLanguage: "en-AU"
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://www.carverity.com.au/"
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Used Car Guide",
              item:
                "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia"
            }
          ]
        }
      ]
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <article className="space-y-12">

        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            What To Check When Buying A Used Car In Australia (2026 Guide)
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Buying a used car in Australia can feel rushed. Sellers are watching,
            test drives are short, and it’s easy to forget what to look for.
            A structured approach makes a big difference.
          </p>
          <p className="text-slate-400 text-base leading-relaxed">
            This guide walks you through a complete used car inspection checklist
            tailored specifically for Australian buyers so you can make calm,
            confident decisions before handing over your money.
          </p>
        </header>

        {/* BEFORE YOU ARRIVE */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Before You Inspect The Car</h2>

          <p className="text-slate-400 leading-relaxed">
            Before physically viewing the vehicle, every Australian buyer should
            complete several checks.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>
              Run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="underline text-white hover:opacity-80 transition"
              >
                PPSR check in Australia
              </Link>{" "}
              to confirm the car isn’t under finance or written off
            </li>
            <li>Confirm the VIN matches registration paperwork</li>
            <li>Ask for full service history and supporting receipts</li>
            <li>Check for outstanding recalls</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            A PPSR check protects you from purchasing a vehicle that still has
            money owing or has previously been declared a statutory write-off.
          </p>

          <p className="text-slate-400 leading-relaxed">
            You should also decide whether{" "}
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              a mechanical inspection is worth it in Australia
            </Link>{" "}
            based on the vehicle’s age, price and service history.
          </p>
        </section>

        {/* EXTERIOR */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Exterior Inspection Checklist</h2>

          <p className="text-slate-400 leading-relaxed">
            Walk around the vehicle slowly. Don’t rush. Look for consistency and
            alignment rather than obvious damage.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Check panel alignment and even spacing</li>
            <li>Look for paint inconsistencies or colour variation</li>
            <li>Inspect for rust (especially in coastal regions)</li>
            <li>Check tyre wear patterns across the full width</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Uneven tyre wear can indicate suspension or alignment issues.
            Mismatched paint can suggest prior accident repairs.
          </p>

          <p className="text-slate-400 leading-relaxed">
            If you’re buying from a dealership rather than a private seller,
            you may also want to compare the risks in our guide on{" "}
            <Link
              to="/dealer-vs-private-seller-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              dealer vs private seller in Australia
            </Link>.
          </p>
        </section>

        {/* INTERIOR & DRIVE */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Interior, Electronics & Test Drive
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Ensure warning lights appear then turn off after startup</li>
            <li>Test air conditioning thoroughly</li>
            <li>Check windows, locks, mirrors and infotainment</li>
            <li>Does the steering pull to one side?</li>
            <li>Is there vibration under braking?</li>
            <li>Are gear changes smooth?</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Many buyers rush this stage. If you want a calmer,
            step-by-step breakdown, see our guide on{" "}
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="underline text-white hover:opacity-80 transition"
            >
              how to inspect a used car in person
            </Link>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Once you’ve identified issues, you may also want guidance on{" "}
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              how much you should offer on a used car in Australia
            </Link>{" "}
            based on condition and risk.
          </p>
        </section>

        {/* COMMON MISTAKES */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Common Used Car Buying Mistakes
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Most buyers don’t miss issues because they don’t care — they miss
            them because they feel pressured or excited.
          </p>

          <p className="text-slate-400 leading-relaxed">
            We break this down in detail in our guide to{" "}
            <Link
              to="/used-car-inspection-mistakes-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              common used car inspection mistakes in Australia
            </Link>.
          </p>
        </section>

        {/* AUTHORITY CLUSTER */}
        <section className="pt-10 border-t border-slate-800 space-y-6">
          <p className="text-slate-400 leading-relaxed">
            If you prefer using a structured mobile checklist during your
            inspection,{" "}
            <Link
              to="/"
              className="text-white underline underline-offset-4 hover:opacity-80 transition"
            >
              CarVerity was built specifically for Australian buyers
            </Link>{" "}
            who want to document what they see and make calmer decisions.
          </p>

          <div className="space-y-2 text-sm text-slate-400">
            <p>
              Learn{" "}
              <Link
                to="/what-to-expect"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                what to expect during a CarVerity inspection
              </Link>.
            </p>

            <p>
              Review our{" "}
              <Link
                to="/pricing"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                pricing options
              </Link>{" "}
              and start confidently.
            </p>

            <p>
              Still unsure? Visit our{" "}
              <Link
                to="/faq"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                frequently asked questions
              </Link>.
            </p>
          </div>

          {/* CLUSTER DISTRIBUTION BLOCK */}
          <div className="pt-6 space-y-2 text-sm text-slate-500">
            <p className="font-semibold text-slate-400">
              Related used car buying guides (Australia):
            </p>
            <p>
              <Link to="/ppsr-check-australia" className="underline hover:text-white">
                PPSR check Australia
              </Link>{" · "}
              <Link to="/how-to-inspect-a-used-car-in-person" className="underline hover:text-white">
                How to inspect a used car in person
              </Link>{" · "}
              <Link to="/used-car-inspection-mistakes-australia" className="underline hover:text-white">
                Used car inspection mistakes
              </Link>{" · "}
              <Link to="/is-a-mechanical-inspection-worth-it-australia" className="underline hover:text-white">
                Is a mechanical inspection worth it?
              </Link>{" · "}
              <Link to="/dealer-vs-private-seller-australia" className="underline hover:text-white">
                Dealer vs private seller
              </Link>{" · "}
              <Link to="/how-much-should-you-offer-used-car-australia" className="underline hover:text-white">
                How much should you offer?
              </Link>
            </p>
          </div>
        </section>

      </article>
    </div>
  );
}