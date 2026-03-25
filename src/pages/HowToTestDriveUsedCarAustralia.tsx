// src/pages/HowToTestDriveUsedCarAustralia.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowToTestDriveUsedCarAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "How To Test Drive A Used Car (Australia 2026 Guide) | CarVerity",
      description:
        "Learn how to test drive a used car in Australia with a clear step-by-step approach. What to check, what to listen for, and common warning signs before you buy.",
      canonical:
        "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-to-test-drive-a-used-car-australia#article",
          headline:
            "How To Test Drive A Used Car (Australia 2026 Guide)",
          description:
            "Learn how to test drive a used car in Australia with a clear step-by-step approach. What to check, what to listen for, and common warning signs before you buy.",
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
              How To Test Drive A Used Car (Australia 2026 Guide)
            </h1>

            <p className="text-slate-400 leading-relaxed">
              A test drive is one of the most important parts of buying a used
              car — but most people are not quite sure what they should actually
              be paying attention to.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In Australia, test drives are often short, awkward, and slightly
              rushed. That makes it easy to miss warning signs that only appear
              when the car is moving.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide gives you a simple, structured way to test drive a used
              car so you can focus on what actually matters.
            </p>
          </header>

          {/* BEFORE YOU DRIVE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Before You Start Driving
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before the car even moves, there are a few things worth checking.
              These early moments can reveal issues straight away.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                Start the engine and watch the dashboard warning lights.
              </li>
              <li>
                Make sure lights appear briefly and then turn off.
              </li>
              <li>Listen to how the engine sounds at idle.</li>
              <li>
                Notice any shaking, roughness, or unusual vibration.
              </li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If something feels off before you even move, it is worth paying
              attention to.
            </p>
          </section>

          {/* LOW SPEED */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: Low-Speed Driving (Initial Feel)
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Start slowly. You are not testing performance — you are testing how
              the car behaves in normal conditions.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car move off smoothly?</li>
              <li>Does the steering feel light and controlled?</li>
              <li>Are there clunks or knocks when moving off?</li>
              <li>Do the brakes feel responsive and straight?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Low-speed driving often reveals suspension noises and early
              warning signs.
            </p>
          </section>

          {/* NORMAL DRIVING */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 3: Normal Driving Conditions
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once you are comfortable, drive at normal suburban speeds. This is
              where you get a better sense of the car’s overall behaviour.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car drive straight without pulling?</li>
              <li>Is the steering stable or does it feel vague?</li>
              <li>Do gear changes feel smooth?</li>
              <li>Is the engine responsive without hesitation?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              A car should feel predictable and controlled — not uncertain or
              inconsistent.
            </p>
          </section>

          {/* BRAKING */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 4: Braking & Control
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Braking performance is critical. Try a few gentle and slightly
              firmer stops in safe conditions.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the car brake in a straight line?</li>
              <li>Is there vibration through the steering wheel?</li>
              <li>Do you hear grinding or squealing?</li>
              <li>Does braking feel smooth or uneven?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Vibration or pulling during braking can indicate worn components.
            </p>
          </section>

          {/* NOISES */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 5: Listen Carefully For Noises
            </h2>

            <p className="text-slate-400 leading-relaxed">
              One of the biggest advantages of a test drive is being able to
              hear how the car behaves.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Knocking sounds over bumps</li>
              <li>Whining noises when accelerating</li>
              <li>Humming or droning at speed</li>
              <li>Rattles from inside the cabin</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              You don’t need to diagnose the problem — just notice that it
              exists.
            </p>
          </section>

          {/* AFTER DRIVE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 6: After The Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once you finish driving, take a moment before making any decision.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check for warning lights that appeared during the drive</li>
              <li>Look under the car for fresh leaks</li>
              <li>Notice any burning smell</li>
              <li>Do one final walk-around</li>
            </ul>
          </section>

          {/* COMMON MISTAKES */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Common Test Drive Mistakes
            </h2>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Driving for only a few minutes</li>
              <li>Talking too much and not focusing</li>
              <li>Ignoring small noises or vibrations</li>
              <li>Feeling rushed by the seller</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If something feels off, it is always worth slowing down and asking
              questions.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Many buyers miss key issues. See our guide to{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                used car inspection mistakes in Australia
              </Link>
              .
            </p>
          </section>

          {/* WHY STRUCTURE */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why Structure Matters During A Test Drive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Most people do not miss problems because they lack knowledge.
              They miss them because the situation is distracting.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Having a simple structure helps you stay focused and notice things
              you would otherwise overlook.
            </p>
          </section>

          {/* CTA */}
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
              <p>
                <Link to="/how-to-inspect-a-used-car-in-person" className="underline hover:text-white">
                  Inspect in person
                </Link>{" · "}
                <Link to="/ppsr-check-australia" className="underline hover:text-white">
                  PPSR check
                </Link>{" · "}
                <Link to="/dealer-vs-private-seller-australia" className="underline hover:text-white">
                  Dealer vs private
                </Link>{" · "}
                <Link to="/how-much-should-you-offer-used-car-australia" className="underline hover:text-white">
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