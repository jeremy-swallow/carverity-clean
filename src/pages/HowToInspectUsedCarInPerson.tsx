// src/pages/HowToInspectUsedCarInPerson.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowToInspectUsedCarInPerson() {
  useEffect(() => {
    applySeo({
      title:
        "How To Inspect A Used Car In Person (Australia 2026 Guide) | CarVerity",
      description:
        "Learn how to inspect a used car in person in Australia with a calm, structured step-by-step approach. A practical guide covering exterior, interior, test drive and red flags.",
      canonical:
        "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person#article",
          headline:
            "How To Inspect A Used Car In Person (Australia 2026 Guide)",
          description:
            "Learn how to inspect a used car in person in Australia with a calm, structured step-by-step approach. A practical guide covering exterior, interior, test drive and red flags.",
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
            "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person",
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
              name: "Inspection Guide",
              item:
                "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person",
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
              How To Inspect A Used Car In Person (Australia 2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Knowing how to inspect a used car properly can save you thousands
              of dollars — and a great deal of stress. In Australia, most used
              car purchases happen quickly, often in car parks, driveways, or
              busy yards. That pressure makes it easy to miss important details.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide walks you through a structured, step-by-step approach
              to inspecting a used car in person. It focuses on what you can
              realistically observe without mechanical tools or specialist
              training.
            </p>
          </header>

          {/* BEFORE YOU ARRIVE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Before You Arrive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A proper used car inspection starts before you even see the
              vehicle. In Australia, there are several essential checks you
              should complete first.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                Run a{" "}
                <Link
                  to="/ppsr-check-australia"
                  className="text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  PPSR check in Australia
                </Link>{" "}
                to confirm the vehicle is not under finance or written off.
              </li>
              <li>Confirm the VIN matches registration paperwork.</li>
              <li>Request full service history and supporting receipts.</li>
              <li>Check for outstanding recalls.</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              These steps reduce financial risk before you invest time in a
              physical inspection.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Depending on the car’s age and value, you may also want to decide
              whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it in Australia
              </Link>.
            </p>
          </section>

          {/* FIRST IMPRESSION */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: First Walk-Around (Exterior Overview)
            </h2>

            <p className="text-slate-400 leading-relaxed">
              When inspecting a used car in person, start by slowly walking
              around the vehicle. You are looking for consistency, not just
              obvious damage.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check panel gaps for even spacing.</li>
              <li>Look for mismatched paint or colour variation.</li>
              <li>
                Inspect for rust, particularly in coastal areas like Melbourne
                or Sydney.
              </li>
              <li>Check tyre wear across the full width of each tyre.</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Uneven tyre wear may indicate alignment or suspension issues.
              Mismatched paint can suggest previous accident repairs.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you’re buying from a dealership rather than a private seller,
              review the risks in our guide to{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>.
            </p>
          </section>

          {/* UNDER BONNET */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Under the Bonnet (Visual Only)
            </h2>

            <p className="text-slate-400 leading-relaxed">
              You do not need to diagnose mechanical problems. Instead, focus
              on visible signs of neglect.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check for visible fluid leaks.</li>
              <li>Inspect battery terminals for corrosion.</li>
              <li>Look at hoses for cracks or wear.</li>
              <li>Be cautious if the engine bay appears excessively cleaned.</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              An overly detailed engine bay may sometimes be used to conceal
              leaks.
            </p>
          </section>

          {/* INTERIOR */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 4: Interior & Electronics
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Electrical repairs can be expensive. Test everything carefully.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                Ensure warning lights appear on startup and then turn off.
              </li>
              <li>Test air conditioning thoroughly.</li>
              <li>
                Check windows, mirrors, locks, and infotainment systems.
              </li>
              <li>
                Confirm odometer readings align with service documentation.
              </li>
            </ul>
          </section>

          {/* TEST DRIVE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 5: The Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many issues become noticeable.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the steering pull to one side?</li>
              <li>Is there vibration under braking?</li>
              <li>Are gear changes smooth?</li>
              <li>Are there unusual engine noises?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Once you’ve identified issues, you may want guidance on{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>{" "}
              based on condition and risk.
            </p>
          </section>

          {/* RED FLAGS */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Common Red Flags When Inspecting A Used Car
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Seller rushing you to decide.</li>
              <li>Inconsistent service history.</li>
              <li>Reluctance to allow inspection.</li>
              <li>Stories that change during conversation.</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Pressure and inconsistency are often stronger warning signs than
              cosmetic flaws.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Many buyers fall into avoidable traps. See our breakdown of{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                common used car inspection mistakes in Australia
              </Link>.
            </p>
          </section>

          {/* STRUCTURE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Structure Matters When Inspecting A Used Car
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most buyers do not miss problems because they lack intelligence.
              They miss them because inspections happen in stressful
              environments.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structured checklist slows the process down and ensures each
              area of the vehicle is evaluated methodically.
            </p>
          </section>

          {/* INTERNAL LINKS / CLUSTER HUB */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              For a full overview of everything to check before buying, read
              our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car inspection checklist for Australia
              </Link>.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you prefer a structured mobile flow during your inspection,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step-by-step
              </Link>{" "}
              and turns your observations into a clear report.
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

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related used car buying guides (Australia):
              </p>
              <p>
                <Link to="/ppsr-check-australia" className="underline hover:text-white">
                  PPSR check Australia
                </Link>{" · "}
                <Link to="/used-car-inspection-mistakes-australia" className="underline hover:text-white">
                  Inspection mistakes
                </Link>{" · "}
                <Link to="/dealer-vs-private-seller-australia" className="underline hover:text-white">
                  Dealer vs private seller
                </Link>{" · "}
                <Link to="/is-a-mechanical-inspection-worth-it-australia" className="underline hover:text-white">
                  Mechanical inspection worth it?
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