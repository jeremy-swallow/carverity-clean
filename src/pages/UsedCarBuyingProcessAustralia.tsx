import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function UsedCarBuyingProcessAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "Used Car Buying Process Australia (Step-by-Step Guide) | CarVerity",
      description:
        "Follow this step-by-step used car buying process in Australia. Learn how to research, run a PPSR check, inspect the car, test drive properly, assess risk, and decide what to offer.",
      canonical:
        "https://www.carverity.com.au/used-car-buying-process-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/used-car-buying-process-australia#article",
          headline:
            "Used Car Buying Process Australia (Step-by-Step Guide)",
          description:
            "A clear step-by-step process for buying a used car in Australia, covering research, PPSR checks, inspections, test drives, risk assessment, and negotiation.",
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
            "https://www.carverity.com.au/used-car-buying-process-australia",
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
              name: "Used Car Buying Process Australia",
              item:
                "https://www.carverity.com.au/used-car-buying-process-australia",
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
              Used Car Buying Process Australia
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Buying a used car in Australia can feel straightforward at first,
              but many expensive mistakes happen because buyers jump between
              steps or rely on instinct instead of a clear process.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Most buyers don’t miss problems because they’re careless… they
              miss them because they don’t have a clear structure.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide gives you a step-by-step process to follow so you can
              reduce risk, stay objective, and make better decisions before you
              commit.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: What Is the Used Car Buying Process?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A structured used car buying process in Australia includes
              researching the car, checking its history, inspecting it
              physically, test driving it properly, assessing risk, and then
              deciding what to offer based on what you found.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Research the car and ask initial questions</li>
              <li>Run a PPSR check</li>
              <li>Inspect the car in person</li>
              <li>Test drive it properly</li>
              <li>Assess risk and condition</li>
              <li>Decide what to offer or walk away</li>
            </ul>
          </section>

          {/* STEP 1 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Research Before You Inspect
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before you even see the car, start with basic research. This helps
              you avoid wasting time on cars that already show warning signs.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check the listing carefully</li>
              <li>Ask about service history and ownership</li>
              <li>Clarify any known issues early</li>
              <li>Compare price against similar vehicles</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              This step is about filtering. You are not trying to prove the car
              is perfect — you are trying to avoid obvious bad options.
            </p>
          </section>

          {/* STEP 2 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: Run a PPSR Check
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before getting too invested, run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                PPSR check in Australia
              </Link>
              .
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check for finance owing</li>
              <li>Check if the car is reported stolen</li>
              <li>Check for write-off history</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              This step protects you from major financial and history risks that
              you cannot see during an inspection.
            </p>
          </section>

          {/* STEP 3 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Inspect the Car in Person
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once the history checks out, move into a structured inspection.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Use a proper{" "}
              <Link
                to="/used-car-checklist-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car checklist
              </Link>{" "}
              so you don’t rely on memory or rush through important details.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check exterior condition and consistency</li>
              <li>Test interior features and electronics</li>
              <li>Look for signs of wear, damage, or poor repair</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If you want a deeper walkthrough, read{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how to inspect a used car in person
              </Link>
              .
            </p>
          </section>

          {/* STEP 4 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 4: Test Drive Properly
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many issues become easier to detect.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check acceleration, braking, and steering</li>
              <li>Listen for unusual noises</li>
              <li>Pay attention to how the car feels overall</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Follow a structured approach using our{" "}
              <Link
                to="/how-to-test-drive-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                test drive guide
              </Link>
              .
            </p>
          </section>

          {/* STEP 5 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 5: Assess Risk and Decide Next Step
            </h2>

            <p className="text-slate-400 leading-relaxed">
              After the inspection and drive, step back and assess what you
              found.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Do the condition and history align?</li>
              <li>Are there unresolved concerns?</li>
              <li>Does the price still make sense?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If uncertainty remains, consider whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it
              </Link>
              .
            </p>
          </section>

          {/* STEP 6 */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 6: Decide What to Offer (or Walk Away)
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The final step is deciding whether the car still makes sense for
              you — and if so, at what price.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Use what you observed to guide your decision. If the car has minor
              issues, they may justify a lower offer. If the risk feels too high,
              walking away is often the better decision.
            </p>

            <p className="text-slate-400 leading-relaxed">
              For a clear framework, read{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>
              .
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you want a structured way to follow this entire process while
              standing next to the car,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step by step
              </Link>{" "}
              and helps you stay objective from start to finish.
            </p>
          </section>
        </article>
      </section>
    </div>
  );
}