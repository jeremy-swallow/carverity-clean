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
            <li>Run a PPSR check to confirm the car isn’t under finance or written off</li>
            <li>Confirm the VIN matches registration paperwork</li>
            <li>Ask for full service history and supporting receipts</li>
            <li>Check for outstanding recalls</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            A PPSR check is essential when buying a used car in Australia. It
            protects you from purchasing a vehicle that still has money owing.
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
            <li>Inspect for rust (especially in coastal regions like Melbourne or Sydney)</li>
            <li>Check tyre wear patterns across the full width</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Uneven tyre wear can indicate suspension or alignment issues.
            Mismatched paint can suggest prior accident repairs.
          </p>
        </section>

        {/* UNDER BONNET */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Under The Bonnet (Visual Only)</h2>

          <p className="text-slate-400 leading-relaxed">
            You don’t need to be a mechanic. You’re simply looking for obvious
            signs of neglect or concealment.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Check for fluid leaks around the engine</li>
            <li>Look for corrosion on battery terminals</li>
            <li>Inspect hoses for cracks or wear</li>
            <li>Be cautious of an excessively clean engine bay</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            An overly detailed engine bay isn’t always a red flag — but it may
            mean the seller is trying to hide leaks.
          </p>
        </section>

        {/* INTERIOR */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Interior & Electronics</h2>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Ensure warning lights appear then turn off after startup</li>
            <li>Test air conditioning thoroughly</li>
            <li>Check windows, locks, mirrors and infotainment</li>
            <li>Verify odometer consistency with service records</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Electrical issues can be expensive to repair. Test everything.
          </p>
        </section>

        {/* TEST DRIVE */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">The Test Drive Checklist</h2>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Does the steering pull to one side?</li>
            <li>Is there vibration under braking?</li>
            <li>Are gear changes smooth?</li>
            <li>Any unusual engine noises?</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Trust your instincts. If something feels wrong, investigate further.
          </p>
        </section>

        {/* RED FLAGS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Common Red Flags When Buying A Used Car</h2>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Seller rushing you</li>
            <li>Inconsistent service records</li>
            <li>Strong oil or coolant smells</li>
            <li>Reluctance to allow inspection</li>
            <li>Stories that change during conversation</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            There will always be another car. Walking away is often the smartest decision.
          </p>
        </section>

        {/* INTERNAL LINK AUTHORITY BLOCK */}
        <section className="pt-10 border-t border-slate-800 space-y-6">
          <p className="text-slate-400 leading-relaxed">
            If you prefer using a structured mobile checklist during your inspection,
            <Link
              to="/"
              className="text-white underline underline-offset-4 ml-1 hover:opacity-80 transition"
            >
              CarVerity was built specifically for Australian buyers
            </Link>{" "}
            who want to document what they see and make calmer decisions.
          </p>

          <div className="space-y-2 text-sm text-slate-400">
            <p>
              Want to understand how the inspection flow works? Read{" "}
              <Link
                to="/what-to-expect"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                what to expect during a CarVerity inspection
              </Link>.
            </p>

            <p>
              Have questions about how the app handles uncertainty or negotiation?
              Visit our{" "}
              <Link
                to="/faq"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                frequently asked questions
              </Link>.
            </p>

            <p>
              Ready to run your own inspection? See{" "}
              <Link
                to="/pricing"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity pricing options
              </Link>{" "}
              and start confidently.
            </p>
          </div>
        </section>

      </article>
    </div>
  );
}
