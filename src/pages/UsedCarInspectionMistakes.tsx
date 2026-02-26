// src/pages/UsedCarInspectionMistakes.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function UsedCarInspectionMistakes() {
  useEffect(() => {
    applySeo({
      title:
        "7 Common Mistakes When Inspecting a Used Car (Australia 2026 Guide) | CarVerity",
      description:
        "Avoid the most common used car inspection mistakes Australian buyers make. Learn what to watch for, how to reduce risk, and how to inspect a used car properly.",
      canonical:
        "https://www.carverity.com.au/used-car-inspection-mistakes-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/used-car-inspection-mistakes-australia#article",
          headline:
            "7 Common Mistakes When Inspecting a Used Car (Australia 2026 Guide)",
          description:
            "A practical guide outlining the most common mistakes Australian buyers make when inspecting a used car and how to avoid them.",
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
            "https://www.carverity.com.au/used-car-inspection-mistakes-australia",
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
              name: "Inspection Mistakes",
              item:
                "https://www.carverity.com.au/used-car-inspection-mistakes-australia",
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
              7 Common Mistakes When Inspecting a Used Car (Australia 2026)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Most buyers don’t regret buying a used car because of one huge
              obvious problem. They regret it because of small things they
              overlooked under pressure.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In Australia, used car inspections often happen quickly — in car
              parks, driveways, or busy yards. That environment makes it easy to
              rush decisions. Below are the most common inspection mistakes —
              and how to avoid them.
            </p>
          </header>

          {/* MISTAKE 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              1. Rushing the Inspection
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Feeling pressure from a seller is common. But rushing is the
              number one mistake buyers make.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A proper inspection takes time. Walking away because you feel
              rushed is often smarter than buying under pressure.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structured approach helps remove emotion. Review our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step inspection guide for Australia
              </Link>
              .
            </p>
          </section>

          {/* MISTAKE 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              2. Focusing Only on Cosmetics
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Shiny paint and clean interiors can distract from mechanical or
              structural concerns.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Look beyond presentation. Focus on panel alignment, tyre wear,
              warning lights, and consistency across the vehicle.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If deeper mechanical concerns exist, consider whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it
              </Link>
              .
            </p>
          </section>

          {/* MISTAKE 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              3. Skipping the PPSR Check
            </h2>

            <p className="text-slate-400 leading-relaxed">
              In Australia, failing to run a PPSR check can expose you to
              serious financial risk.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A PPSR confirms whether a vehicle is under finance or previously
              written off. Never skip this step.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Learn exactly{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                what a PPSR check is in Australia
              </Link>
              .
            </p>
          </section>

          {/* MISTAKE 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              4. Ignoring Warning Lights
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Some sellers may start the vehicle before you arrive.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Always watch the dashboard during startup. Warning lights should
              appear briefly and then turn off. Lights that remain on require
              explanation.
            </p>
          </section>

          {/* MISTAKE 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              5. Not Testing Everything
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Electrical components can be expensive to repair.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Test windows, locks, mirrors, infotainment systems, and air
              conditioning thoroughly.
            </p>
          </section>

          {/* MISTAKE 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              6. Skipping a Proper Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many issues become noticeable.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the steering pull?</li>
              <li>Is there vibration under braking?</li>
              <li>Are gear changes smooth?</li>
              <li>Any unusual noises?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If something feels wrong, investigate before committing.
            </p>
          </section>

          {/* MISTAKE 7 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              7. Not Using a Structured Checklist
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most buyers rely on memory. That’s risky.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structured inspection checklist ensures you move methodically
              through exterior, interior, and driving checks without skipping
              key steps.
            </p>

            <p className="text-slate-400 leading-relaxed">
              See our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car checklist for Australia
              </Link>
              .
            </p>
          </section>

          {/* CLUSTER DISTRIBUTION */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              Want to calculate a fair offer after inspection? Read our{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car negotiation guide
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              Comparing buying environments? See{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              Prefer a structured mobile inspection flow?{" "}
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
                <Link to="/is-a-mechanical-inspection-worth-it-australia" className="underline hover:text-white">
                  Mechanical inspection worth it?
                </Link>{" · "}
                <Link to="/how-much-should-you-offer-used-car-australia" className="underline hover:text-white">
                  Negotiation guide
                </Link>
              </p>
            </div>
          </section>

        </article>
      </section>
    </div>
  );
}