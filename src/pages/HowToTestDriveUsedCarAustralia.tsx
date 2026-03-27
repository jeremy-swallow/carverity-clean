import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowToTestDriveUsedCarAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "How To Test Drive a Used Car (What to Check Before You Buy)",
      description:
        "Learn how to test drive a used car in Australia with a practical step-by-step approach. What to check before driving, what to listen for on the road, which warning signs matter, and the common mistakes buyers make.",
      canonical:
        "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia#article",
          headline:
            "How To Test Drive a Used Car (What to Check Before You Buy)",
          description:
            "A practical Australian guide explaining what to check before the car moves, what to pay attention to during the drive, and which red flags buyers often miss.",
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
            "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia",
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How do you test drive a used car properly?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Test drive a used car properly by checking warning lights and engine behaviour before moving, then driving at low speed and normal road speed while paying attention to steering, braking, gear changes, noises, vibration, and overall consistency.",
              },
            },
            {
              "@type": "Question",
              name: "What should I look for during a used car test drive?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "During a used car test drive, look for steering pull, braking vibration, unusual engine or suspension noises, rough gear changes, hesitation under acceleration, warning lights, and anything that feels inconsistent or rushed.",
              },
            },
            {
              "@type": "Question",
              name: "How long should a used car test drive be?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "A used car test drive should be long enough to assess low-speed behaviour, normal suburban driving, braking, and general feel. A drive that is too short can make it easier to miss warning signs.",
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
              name: "Test Drive Guide",
              item:
                "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia",
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
              How To Test Drive a Used Car
            </h1>

            <p className="text-slate-400 leading-relaxed">
              A test drive is one of the most important parts of buying a used
              car, but many buyers are not fully sure what they should actually
              be paying attention to once the car starts moving.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In Australia, test drives are often short, awkward, and slightly
              rushed. That makes it easy to miss warning signs that only appear
              when the vehicle is under normal driving conditions.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide gives you a practical step-by-step way to test drive a
              used car so you can focus on what matters, notice red flags
              earlier, and make a calmer decision before you buy.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: How Do You Test Drive a Used Car Properly?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              To test drive a used car properly, check the dashboard warning
              lights and idle first, then drive at low speed and normal road
              speed while paying attention to steering, braking, gear changes,
              engine response, vibration, and unusual noises. Follow the same
              structure each time so the seller or situation does not rush you
              past important details.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check the car before it moves</li>
              <li>Start with low-speed driving</li>
              <li>Drive at normal suburban speed</li>
              <li>Test braking in safe conditions</li>
              <li>Listen carefully for noises and vibration</li>
              <li>Review the car again once the drive ends</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              A lot of buying mistakes happen because people drive the car, but
              do not assess it in a structured way.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Before You Start Driving
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before the car even moves, there are a few things worth checking.
              These early moments can reveal issues immediately.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Start the engine and watch the dashboard warning lights</li>
              <li>Make sure the lights appear briefly and then switch off</li>
              <li>Listen to how the engine sounds at idle</li>
              <li>Notice shaking, roughness or unusual vibration</li>
              <li>Check that air conditioning and basic controls work</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If something feels off before you even move, that matters. It does
              not always mean the car is bad, but it should make you pay closer
              attention during the rest of the drive.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Before getting this far, it is also smart to run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                PPSR check in Australia
              </Link>{" "}
              so you are not spending time on a car with a serious history or
              finance problem.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: Low-Speed Driving
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Start slowly. You are not testing performance. You are testing how
              the car behaves in ordinary conditions.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car move off smoothly?</li>
              <li>Does the steering feel controlled and predictable?</li>
              <li>Are there clunks or knocks when moving off?</li>
              <li>Do the brakes feel straight and responsive?</li>
              <li>Does anything feel unusually harsh or hesitant?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Low-speed driving often reveals early suspension noises, steering
              concerns, and braking problems that buyers might otherwise ignore.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Normal Driving Conditions
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once you are comfortable, drive at normal suburban speeds. This is
              where you get a clearer sense of the car’s overall behaviour.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car drive straight without pulling?</li>
              <li>Does the steering feel stable or vague?</li>
              <li>Do gear changes feel smooth and consistent?</li>
              <li>Is the engine responsive without hesitation?</li>
              <li>Does anything feel uneven, uncertain or delayed?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              A good used car should feel predictable and settled, not strange
              or inconsistent.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Mileage can also change how you interpret what you notice during a
              drive, especially when it comes to wear, responsiveness, and
              overall condition. If you are unsure how to think about that, read{" "}
              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how many km is too many for a used car in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              Small issues during a test drive don’t always mean you should walk
              away — but they do affect how you think about the price.
              Understanding how buyers adjust their offer based on what they
              notice can help you stay balanced.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you’re not sure how to factor this in, see{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want the full inspection process before and around the
              drive, read our guide on{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how to inspect a used car in person
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 4: Braking and Control
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Braking performance matters. Try a few gentle stops and, where
              safe and appropriate, one or two firmer stops so you can judge how
              the car behaves.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car brake in a straight line?</li>
              <li>Is there vibration through the steering wheel?</li>
              <li>Do you hear squealing, grinding or scraping?</li>
              <li>Does braking feel smooth or uneven?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Pulling or vibration during braking can point to worn or uneven
              components. You do not need to diagnose the exact cause to know it
              deserves attention.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 5: Listen Carefully for Noises
            </h2>

            <p className="text-slate-400 leading-relaxed">
              One of the biggest advantages of a test drive is hearing how the
              car behaves in motion. Do not talk your way through the whole
              drive. Give yourself enough quiet to notice things.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Knocking sounds over bumps</li>
              <li>Whining noises during acceleration</li>
              <li>Humming or droning at speed</li>
              <li>Rattles from inside the cabin</li>
              <li>Anything that appears only under load or braking</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              You do not need to identify the problem perfectly. You only need
              to notice that something is there and take it seriously.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 6: After the Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once the drive is finished, take a moment before making any
              decision. This is a good time to look again with a clearer head.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check for warning lights that appeared during the drive</li>
              <li>Look underneath for fresh leaks</li>
              <li>Notice any burning smell or heat-related issue</li>
              <li>Do one final walk-around of the car</li>
              <li>Write down anything that felt questionable</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Problems that show up after the drive can matter just as much as
              the ones you notice while moving.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Once you’ve finished the test drive and have a feel for how the
              car drives, the next step is deciding what it’s actually worth to
              you. If you’re unsure how buyers typically approach this, read{" "}
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
              Common Used Car Test Drive Mistakes
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Driving for only a few minutes</li>
              <li>Talking too much and not focusing on the car</li>
              <li>Ignoring small noises or vibration</li>
              <li>Feeling rushed by the seller</li>
              <li>Not checking the car again after the drive</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Many buyers miss useful information simply because they treat the
              test drive like a quick formality instead of part of the actual
              inspection.
            </p>

            <p className="text-slate-400 leading-relaxed">
              We unpack more of these avoidable mistakes in our guide to{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car inspection mistakes in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What to Do if Something Feels Off
            </h2>

            <p className="text-slate-400 leading-relaxed">
              If the car pulls, vibrates, hesitates, makes odd noises, or simply
              feels inconsistent, slow the process down. That does not always
              mean you must walk away immediately, but it does mean you should
              not ignore what you noticed.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Some issues may support negotiation. Others may be enough to rule
              the car out, especially if the seller becomes vague or dismissive.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are trying to judge price after spotting issues, our guide
              on{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>{" "}
              can help.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Structure Matters During a Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most people do not miss problems because they are careless. They
              miss them because the situation is distracting, social, and often
              rushed.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Having a simple structure helps you stay focused and notice things
              you would otherwise overlook.
            </p>

            <p className="text-slate-400 leading-relaxed">
              That is also why{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity
              </Link>{" "}
              guides buyers through the drive step by step and helps capture
              what they notice in a more structured way.
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  What should I listen for during a used car test drive?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Listen for knocking, whining, humming, droning, rattles, or
                  any sound that appears during bumps, braking, acceleration, or
                  steady driving.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Should a used car test drive include braking checks?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Yes. Braking behaviour is one of the most important things to
                  pay attention to. You want to know whether the car stops
                  smoothly, straight, and without vibration or strange noises.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Is a short test drive enough?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Often no. A drive that is too short can make it easier to miss
                  issues that only show up once the car is warmed up or moving
                  under normal road conditions.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              For a full inspection process, start with our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car inspection checklist for Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              After the test drive, most buyers move straight into price
              discussions. Taking a moment to think clearly about your position
              can make a big difference. If you want a simple framework, read{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much you should offer on a used car in Australia
              </Link>{" "}
              before making your move.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want step-by-step guidance while you are actually in the
              car,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you through the test drive
              </Link>{" "}
              and helps you capture what you notice in a structured way.
            </p>

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related guides (Australia):
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
                  to="/ppsr-check-australia"
                  className="underline hover:text-white"
                >
                  PPSR check
                </Link>{" · "}
                <Link
                  to="/used-car-inspection-mistakes-australia"
                  className="underline hover:text-white"
                >
                  Inspection mistakes
                </Link>{" · "}
                <Link
                  to="/dealer-vs-private-seller-australia"
                  className="underline hover:text-white"
                >
                  Dealer vs private
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
                  How much to offer
                </Link>
              </p>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}