import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function UsedCarInspectionMistakes() {
  useEffect(() => {
    applySeo({
      title:
        "Used Car Inspection Mistakes to Avoid (What Buyers Often Miss)",
      description:
        "Avoid the most common used car inspection mistakes Australian buyers make. Learn what people miss under pressure, which red flags matter, and how to inspect a used car more confidently before buying.",
      canonical:
        "https://www.carverity.com.au/used-car-inspection-mistakes-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/used-car-inspection-mistakes-australia#article",
          headline:
            "Used Car Inspection Mistakes to Avoid (What Buyers Often Miss)",
          description:
            "A practical Australian guide explaining the most common used car inspection mistakes and how to avoid them before buying.",
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
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What are the most common used car inspection mistakes?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Common used car inspection mistakes include rushing the inspection, focusing too much on cosmetics, skipping a PPSR check, not watching warning lights at startup, failing to test interior features properly, doing a weak test drive, and relying on memory instead of using a checklist.",
              },
            },
            {
              "@type": "Question",
              name: "Why do buyers miss problems when inspecting a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Buyers often miss problems because inspections happen under pressure. Sellers may be watching, the setting may feel awkward, and buyers may become distracted by presentation or excitement instead of following a consistent process.",
              },
            },
            {
              "@type": "Question",
              name: "How can I avoid missing things when inspecting a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "You can avoid missing things by checking the history before you arrive, inspecting the car in a set order, testing cabin features properly, taking a meaningful test drive, and using a structured checklist so you are not relying on memory.",
              },
            },
          ],
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
              Used Car Inspection Mistakes to Avoid
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Most buyers do not regret buying a used car because of one huge,
              obvious problem. They regret it because of smaller things they
              overlooked while feeling rushed, distracted, or overly reassured.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In Australia, used car inspections often happen in driveways, car
              parks, or busy yards where the environment itself makes it easier
              to miss details. This page breaks down the most common mistakes
              buyers make and how to avoid them.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you know what buyers usually get wrong, it becomes much easier
              to inspect a car more calmly and make a better decision.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: What Are the Most Common Used Car Inspection Mistakes?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The most common used car inspection mistakes are rushing the
              inspection, getting distracted by presentation, skipping history
              checks, ignoring dashboard warning lights, failing to test cabin
              features properly, doing a weak test drive, and relying on memory
              instead of following a structure.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Rushing because the seller feels impatient</li>
              <li>Focusing too heavily on cosmetic appearance</li>
              <li>Skipping a PPSR check</li>
              <li>Not watching the dashboard at startup</li>
              <li>Not testing windows, locks, air conditioning and electronics</li>
              <li>Doing a short or unfocused test drive</li>
              <li>Trying to remember everything instead of using a checklist</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Most of these mistakes are avoidable once you have a repeatable
              process.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Rushing the Inspection</h2>

            <p className="text-slate-400 leading-relaxed">
              Feeling pressure from a seller is common, especially when the car
              seems popular or the conversation feels awkward. But rushing is
              one of the biggest mistakes buyers make.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A proper inspection takes time. If the situation feels rushed, you
              are much more likely to skip checks, stop asking questions, or
              talk yourself into overlooking things that deserve attention.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A better approach is to follow a structure from start to finish.
              Our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step guide to inspecting a used car in person
              </Link>{" "}
              can help with that.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              2. Focusing Too Much on Cosmetics
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Clean paint, shiny tyres, and a tidy interior can create false
              confidence. Presentation matters, but it should never replace a
              proper inspection.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Buyers often get distracted by how nice the car looks and fail to
              pay enough attention to tyre wear, panel consistency, warning
              lights, or how the car actually behaves on the road.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are unsure how deep to go, you may also want to consider
              whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Skipping the PPSR Check</h2>

            <p className="text-slate-400 leading-relaxed">
              In Australia, skipping a PPSR check can expose you to financial
              and history risks before you even reach the physical inspection.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check can help confirm whether the car has money owing, has
              been recorded as stolen, or has a write-off history. It is one of
              the most important checks because it can rule out a bad option
              early.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Learn more in our guide to{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                what a PPSR check is in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              4. Not Watching the Warning Lights Properly
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Some sellers may start the car before you arrive, which can make
              it easier to miss how the dashboard behaves at startup.
            </p>

            <p className="text-slate-400 leading-relaxed">
              You want to see the warning lights appear briefly and then turn
              off. If a light stays on, behaves oddly, or does not appear as
              expected, that deserves explanation.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This is a simple check, but many buyers miss it because they begin
              talking, looking around the cabin, or assuming everything is fine.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              5. Not Testing the Interior Properly
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Interior and electrical issues are easy to underestimate. A car
              can drive acceptably and still leave you with annoying or
              expensive cabin-related problems after purchase.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Test the air conditioning properly, check windows, mirrors, locks,
              infotainment features, reversing camera if fitted, and other basic
              controls you will actually use.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Buyers often assume these details are minor until they become
              their problem.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              6. Doing a Weak or Too-Short Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many important warning signs become
              noticeable, but plenty of buyers treat it like a quick formality
              instead of part of the real inspection.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the steering pull to one side?</li>
              <li>Is there vibration under braking?</li>
              <li>Do gear changes feel smooth?</li>
              <li>Are there odd noises during acceleration or over bumps?</li>
              <li>Does the car feel stable and predictable?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If you want a clearer framework for this stage, read our guide on{" "}
              <Link
                to="/how-to-test-drive-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how to test drive a used car in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              7. Relying on Memory Instead of a Structure
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most buyers rely on memory when they inspect a used car. That is a
              mistake, especially in a situation that already feels social,
              distracting, and pressured.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A checklist helps you move methodically through the car instead of
              jumping around and forgetting what you meant to test.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want a better structure, use our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car checklist for Australia
              </Link>{" "}
              or our{" "}
              <Link
                to="/used-car-checklist-printable"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                printable used car checklist
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Buyers Miss Things Even When They Are Trying to Be Careful
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most people do not miss problems because they are careless or
              unintelligent. They miss them because the inspection environment
              itself is working against them.
            </p>

            <p className="text-slate-400 leading-relaxed">
              The seller is nearby, the car may look appealing, the conversation
              keeps moving, and there is pressure to decide. That combination
              makes it easy to skip checks or talk yourself out of a concern.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Structure is what protects you. It slows the process down and
              makes it easier to notice what is actually in front of you.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What to Do Instead of Making These Mistakes
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The best alternative is simple: check the history first, inspect
              the car in a set order, test the cabin properly, take a meaningful
              drive, and write down anything that feels inconsistent.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you find problems, slow the process down. Some issues may only
              support negotiation. Others may be enough to justify walking away.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are working out what those issues mean for price, read our{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                guide on how much to offer on a used car in Australia
              </Link>
              .
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  What is the biggest mistake when buying a used car?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Rushing the process is one of the biggest mistakes because it
                  causes buyers to miss smaller warning signs that can matter a
                  lot later.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Is a clean-looking used car usually safer to buy?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Not necessarily. Clean presentation can make a car feel more
                  trustworthy, but it does not replace proper checks on history,
                  condition, warning lights, tyres, and road behaviour.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  How can I avoid forgetting important checks?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Use a checklist or a structured step-by-step process. That is
                  much safer than trying to rely on memory in a pressured
                  inspection environment.
                </p>
              </div>
            </div>
          </section>

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
                CarVerity guides you step by step
              </Link>{" "}
              and helps you document what you observe before committing.
            </p>

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related used car buying guides (Australia):
              </p>
              <p className="leading-relaxed">
                <Link
                  to="/what-to-check-when-buying-a-used-car-australia"
                  className="underline hover:text-white"
                >
                  What to check when buying a used car
                </Link>{" · "}
                <Link
                  to="/how-to-inspect-a-used-car-in-person"
                  className="underline hover:text-white"
                >
                  Inspect in person
                </Link>{" · "}
                <Link
                  to="/how-to-test-drive-a-used-car-australia"
                  className="underline hover:text-white"
                >
                  Test drive a used car
                </Link>{" · "}
                <Link
                  to="/ppsr-check-australia"
                  className="underline hover:text-white"
                >
                  PPSR check
                </Link>{" · "}
                <Link
                  to="/used-car-checklist-australia"
                  className="underline hover:text-white"
                >
                  Used car checklist
                </Link>{" · "}
                <Link
                  to="/used-car-checklist-printable"
                  className="underline hover:text-white"
                >
                  Printable checklist
                </Link>{" · "}
                <Link
                  to="/is-a-mechanical-inspection-worth-it-australia"
                  className="underline hover:text-white"
                >
                  Mechanical inspection worth it?
                </Link>{" · "}
                <Link
                  to="/how-much-should-you-offer-used-car-australia"
                  className="underline hover:text-white"
                >
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