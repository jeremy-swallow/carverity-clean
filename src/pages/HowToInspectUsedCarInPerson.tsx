import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowToInspectUsedCarInPerson() {
  useEffect(() => {
    applySeo({
      title:
        "How To Inspect a Used Car in Person (Without Missing Red Flags) | CarVerity",
      description:
        "Learn how to inspect a used car in person in Australia with a practical step-by-step process. What to check before you arrive, around the car, inside the cabin, during the test drive, and which red flags buyers often miss.",
      canonical:
        "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-to-inspect-a-used-car-in-person#article",
          headline:
            "How To Inspect a Used Car in Person (Without Missing Red Flags)",
          description:
            "A practical Australian guide covering what to check before arrival, around the car, inside the cabin, and during the test drive when inspecting a used car in person.",
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
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do you inspect a used car in person?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Inspect a used car in person by checking its history first, then walking around the exterior slowly, testing the interior and electronics carefully, and taking it on a proper test drive. The goal is to follow a consistent process so you do not miss red flags under pressure.",
              },
            },
            {
              "@type": "Question",
              name: "What should I look for when inspecting a used car in person?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Look for inconsistent paint, uneven tyre wear, warning lights that stay on, poor service history, signs of water or interior wear, unusual noises on the test drive, braking vibration, steering pull, and seller behaviour that feels rushed or unclear.",
              },
            },
            {
              "@type": "Question",
              name: "Should I inspect a used car before doing a PPSR check?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "It is usually better to do a PPSR check before spending too much time on the physical inspection. That helps rule out major financial or written-off history issues early.",
              },
            },
            {
              "@type": "Question",
              name: "How long should a used car inspection take?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Long enough that you do not feel rushed. Even a straightforward in-person inspection should give you time to review paperwork, walk around the vehicle, test the cabin properly, and take a meaningful drive.",
              },
            },
            {
              "@type": "Question",
              name: "Is a PPSR check enough on its own?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "No. A PPSR check is important, but it does not replace a physical inspection, service history review, or test drive.",
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
              How To Inspect a Used Car in Person
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Knowing how to inspect a used car in person can save you from
              expensive regret. In Australia, these inspections often happen in
              driveways, car parks, or busy yards where it is easy to feel
              rushed and overlook something important.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide gives you a practical step-by-step process you can
              follow in real life. It focuses on what ordinary buyers can
              realistically check without specialist tools or mechanical
              training.
            </p>

            <p className="text-slate-400 leading-relaxed">
              The goal is not to diagnose everything. It is to inspect the car
              calmly, spot obvious warning signs, and make a better decision
              before you commit.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: How Do You Inspect a Used Car in Person?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              To inspect a used car in person, start with the paperwork and
              vehicle history, then walk around the outside slowly, check the
              cabin and electronics carefully, and take the car on a proper test
              drive. Follow the same order every time so pressure does not cause
              you to miss details.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check the history before you arrive</li>
              <li>Inspect the exterior for inconsistency, not just damage</li>
              <li>Test warning lights, air conditioning and cabin features</li>
              <li>Drive the car and pay attention to feel, sound and braking</li>
              <li>Slow down if anything feels off, vague or rushed</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              That structure alone will put you ahead of many buyers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Step 1: Before You Arrive</h2>

            <p className="text-slate-400 leading-relaxed">
              A proper inspection starts before you even see the vehicle. This
              helps you avoid wasting time on the wrong car and gives you a
              clearer idea of what needs attention once you get there.
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
                to check for finance, stolen status, or write-off history
              </li>
              <li>Confirm the VIN matches the registration paperwork</li>
              <li>Ask for full service history and supporting receipts</li>
              <li>Check whether any recalls are outstanding</li>
              <li>Ask direct questions about faults, repairs and ownership</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              These checks help reduce risk before you become emotionally
              invested in the car.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Depending on the age, value and condition of the car, you may also
              want to decide whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are already thinking ahead to negotiation, it can also help
              to understand how buyers often approach pricing before you become
              too invested. Our guide on{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much you should offer on a used car in Australia
              </Link>{" "}
              can help frame that side of the decision.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: First Walk-Around of the Exterior
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Start by slowly walking around the car. Do not rush to the obvious
              dents and scratches. Look for consistency across the whole
              vehicle.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check panel gaps for even spacing</li>
              <li>Look for mismatched paint or colour variation</li>
              <li>Inspect for rust, bubbling or corrosion</li>
              <li>Check tyre wear across the full width of each tyre</li>
              <li>Look at headlights, tail-lights and glass condition</li>
              <li>Watch for overspray, poorly aligned panels or repair clues</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Uneven tyre wear may point to alignment or suspension issues.
              Paint inconsistency may suggest prior repairs. These are the kinds
              of details buyers often miss because the car looks clean at first
              glance.
            </p>

            <p className="text-slate-400 leading-relaxed">
              For a broader overview of what buyers should check before purchase,
              see our main guide on{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                what to check when buying a used car in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Look Inside the Cabin Properly
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A tidy interior can create false confidence. Instead of judging
              the cabin only by appearance, test how things actually function.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Make sure warning lights appear at startup, then turn off</li>
              <li>Test the air conditioning properly</li>
              <li>Check windows, mirrors, locks and infotainment</li>
              <li>Look for unusual smells, moisture or signs of leaks</li>
              <li>Compare wear on seats, wheel and pedals with the odometer</li>
              <li>Check that buttons and switches work normally</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Interior wear that feels inconsistent with the claimed kilometres
              is worth questioning. It may be harmless, but it should not be
              ignored. If you want a clearer sense of when odometer readings
              start becoming a concern, read{" "}
              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how many km is too many for a used car in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want a simpler inspection flow to follow while standing
              next to the car, our{" "}
              <Link
                to="/used-car-checklist-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car checklist for Australia
              </Link>{" "}
              can help keep you structured.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 4: Use the Test Drive Properly
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many meaningful problems show up, but it
              only helps if you stay deliberate and know what to pay attention
              to.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the steering pull to one side?</li>
              <li>Is there vibration when braking?</li>
              <li>Are gear changes smooth and predictable?</li>
              <li>Do you hear unusual knocks, clunks or whining sounds?</li>
              <li>Does the engine feel hesitant, rough or weak?</li>
              <li>Does anything feel inconsistent at normal road speed?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Buyers often remember to drive the car but forget to assess it in
              a structured way. That is why this step matters so much.
            </p>

            <p className="text-slate-400 leading-relaxed">
              What you notice during the drive should also shape how you think
              about price. Small issues do not always mean you should walk away,
              but they do affect your position and how confident you feel about
              the asking price.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are unsure how buyers usually adjust their offer based on
              what they notice, see{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              For a more focused driving breakdown, read our guide on{" "}
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
              Step 5: Watch the Seller as Well as the Car
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A used car inspection is not only about the vehicle. Seller
              behaviour can tell you a lot as well.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Are they rushing you to decide?</li>
              <li>Do their answers stay consistent?</li>
              <li>Are they reluctant to let you inspect properly?</li>
              <li>Do they become vague when asked about history or repairs?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Pressure and inconsistency are often stronger warning signs than a
              cosmetic flaw. A genuine seller usually does not need to push you
              through the process.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are comparing different sale types, our guide on{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>{" "}
              breaks down how the risks can differ.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Common Red Flags When Inspecting a Used Car in Person
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Seller rushing you or discouraging checks</li>
              <li>Inconsistent or incomplete service history</li>
              <li>Paint and panel inconsistencies</li>
              <li>Uneven tyre wear</li>
              <li>Warning lights that stay on</li>
              <li>Vibration, pulling or poor shifting on the drive</li>
              <li>Stories that change during conversation</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              None of these automatically means the car is a hard no, but they
              should slow you down and make you ask better questions.
            </p>

            <p className="text-slate-400 leading-relaxed">
              We unpack this further in our guide to{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                common used car inspection mistakes in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What to Do if You Notice Problems
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Not every issue means you should walk away immediately. Some
              problems support negotiation. Others suggest the car carries more
              risk than the asking price justifies.
            </p>

            <p className="text-slate-400 leading-relaxed">
              The important thing is to document what you noticed, stay calm,
              and avoid making a quick emotional decision on the spot.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Once you have finished inspecting the car, most buyers move
              straight into deciding what to do next. If you want a clearer
              framework before making an offer, read{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much you should offer on a used car in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Structure Matters During a Used Car Inspection
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most buyers do not miss problems because they are careless. They
              miss them because inspections happen in distracting, pressured
              environments.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structure slows the process down. It gives you a repeatable way
              to check the car without relying on memory or confidence in the
              moment.
            </p>

            <p className="text-slate-400 leading-relaxed">
              That is also why tools like{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity
              </Link>{" "}
              exist: to guide buyers step by step, help them record what they
              notice, and reduce the chance of missing something important while
              inspecting in person.
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  How long should a used car inspection take?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Long enough that you do not feel rushed. Even a straightforward
                  in-person inspection should give you time to review paperwork,
                  walk around the vehicle, test the cabin properly, and take a
                  meaningful drive.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Should I inspect a used car even if it looks clean?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Yes. A clean-looking car can still have warning signs that
                  only show up when you inspect methodically and test things
                  properly.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Is a PPSR check enough on its own?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  No. A PPSR check is important, but it does not replace a
                  physical inspection, service history review, or test drive.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-6 space-y-3 text-sm text-slate-500">
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
                to="/ppsr-check-australia"
                className="underline hover:text-white"
              >
                PPSR check Australia
              </Link>{" · "}
              <Link
                to="/how-to-test-drive-a-used-car-australia"
                className="underline hover:text-white"
              >
                How to test drive a used car
              </Link>{" · "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="underline hover:text-white"
              >
                Inspection mistakes
              </Link>{" · "}
              <Link
                to="/used-car-checklist-australia"
                className="underline hover:text-white"
              >
                Used car checklist Australia
              </Link>{" · "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="underline hover:text-white"
              >
                Mechanical inspection worth it?
              </Link>{" · "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="underline hover:text-white"
              >
                Dealer vs private seller
              </Link>{" · "}
              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="underline hover:text-white"
              >
                How many km is too many?
              </Link>{" · "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="underline hover:text-white"
              >
                How much to offer?
              </Link>
            </p>
          </section>
        </article>
      </section>
    </div>
  );
}