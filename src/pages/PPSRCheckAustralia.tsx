import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function PPSRCheckAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "PPSR Check Australia (Why It Matters Before Buying a Used Car)",
      description:
        "Learn what a PPSR check is in Australia, what it tells you, why it matters before buying a used car, and what a PPSR check does not tell you about the vehicle.",
      canonical: "https://www.carverity.com.au/ppsr-check-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": "https://www.carverity.com.au/ppsr-check-australia#article",
          headline:
            "PPSR Check Australia (Why It Matters Before Buying a Used Car)",
          description:
            "A practical Australian guide explaining what a PPSR check is, what it tells used car buyers, why it matters, and what it does not cover.",
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
          mainEntityOfPage: "https://www.carverity.com.au/ppsr-check-australia",
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is a PPSR check in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "A PPSR check in Australia is a search of the Personal Property Securities Register that helps show whether a vehicle has money owing, has been recorded as stolen, or has a write-off history.",
              },
            },
            {
              "@type": "Question",
              name: "Is a PPSR check enough before buying a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "No. A PPSR check is important for financial and history risk, but it does not tell you the car’s actual condition, service quality, or how it behaves on the road.",
              },
            },
            {
              "@type": "Question",
              name: "What does a PPSR check not tell you?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "A PPSR check does not tell you whether a car is mechanically healthy, whether it has been maintained well, or whether it has cosmetic or driving issues that only show up during an inspection or test drive.",
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
              name: "PPSR Check",
              item: "https://www.carverity.com.au/ppsr-check-australia",
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
              PPSR Check Australia
            </h1>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check is one of the most important early steps when buying
              a used car in Australia. It helps you understand whether the
              vehicle carries financial or history risks before you spend money
              or become too invested.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Skipping this step can expose you to serious problems that are not
              obvious from looking at the car. This guide explains what a PPSR
              check is, why it matters, what it can tell you, and what it cannot.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check can tell you about finance and recorded history, but
              it does not tell you whether the odometer reading represents
              reasonable wear for the car’s age and usage. If you want help
              judging that side of the risk, read{" "}
              <Link
                to="/how-many-km-is-too-many-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how many km is too many for a used car in Australia
              </Link>
              .
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: What Is a PPSR Check?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check is a search of the Personal Property Securities
              Register in Australia. Used car buyers use it to check whether a
              vehicle has money owing, has been reported stolen, or has a
              recorded write-off history.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Shows whether finance is recorded against the vehicle</li>
              <li>Can reveal stolen status</li>
              <li>Can show write-off history</li>
              <li>Helps reduce major pre-purchase risk</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              It is one of the first checks worth doing because it can rule out
              a bad option before you waste more time on it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What Does PPSR Stand For?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              PPSR stands for the Personal Property Securities Register. It is
              the official Australian register used to record security interests
              over personal property, including vehicles.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In simple terms, if a car has finance attached to it, that
              interest may be recorded there. That matters because a lender may
              still have rights over the vehicle if the loan has not been
              cleared properly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why a PPSR Check Matters Before Buying a Used Car
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A used car can look clean, drive reasonably well, and still carry
              serious financial or history problems. That is what makes the PPSR
              check so important.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Buyers often focus on the physical condition of the car first, but
              the history risk can be just as important. A PPSR check helps you
              spot problems that will not show up during a walk-around or test
              drive.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>It can help protect you from buying a car with finance owing</li>
              <li>It can reveal whether the vehicle has a serious history issue</li>
              <li>It gives you a stronger base before you inspect or negotiate</li>
              <li>It helps you ask better questions if something does not look right</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What a PPSR Check Can Tell You
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check is useful because it focuses on major history and
              registration-related risks, not general condition.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Whether finance is recorded against the vehicle</li>
              <li>Whether the vehicle has been reported stolen</li>
              <li>Whether the vehicle has write-off history recorded</li>
              <li>Whether the key identifier information matches what you were given</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              For buyers, this makes it one of the best early filters before
              committing more time to the car.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What a PPSR Check Does Not Tell You
            </h2>

            <p className="text-slate-400 leading-relaxed">
              This is where many buyers misunderstand the PPSR. A clean PPSR
              result does not mean the car is automatically a good buy.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check does not confirm mechanical condition, service
              quality, cosmetic standard, how well the car has been maintained,
              or how it behaves on the road.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>It does not replace a physical inspection</li>
              <li>It does not replace a test drive</li>
              <li>It does not replace checking service history</li>
              <li>It does not replace a mechanic inspection where appropriate</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              That is why a PPSR check should be treated as one part of the
              buying process, not the whole process.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              How To Run a PPSR Check in Australia
            </h2>

            <p className="text-slate-400 leading-relaxed">
              You can run a PPSR check online using the vehicle’s VIN. The
              process is usually quick, but accuracy matters. Always make sure
              the VIN you are using matches the car itself and the paperwork you
              have been shown.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Confirm the VIN against the vehicle and registration details
              carefully. If those details do not line up cleanly, that is a
              reason to slow down and ask more questions.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want help checking those details in person, review our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step used car inspection guide
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              When To Run the PPSR Check
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Ideally, do the PPSR check before getting too far into the buying
              process. That way, you reduce the chance of wasting effort on a
              car that already has a major history problem.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A good sequence is:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check the listing and ask initial questions</li>
              <li>Confirm the VIN and basic paperwork details</li>
              <li>Run the PPSR check</li>
              <li>Only then move into the deeper physical inspection</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              This approach helps you stay more objective and reduces wasted
              time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Combine a PPSR Check With a Proper Inspection
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A PPSR check protects you from one category of risk. A proper
              inspection protects you from another.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Once the history side looks acceptable, you still need to inspect
              the car itself. That means checking the body, tyres, interior,
              warning lights, service history, and how the car behaves during
              the drive.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Start with our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car checklist for Australia
              </Link>{" "}
              and our{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                guide to common used car inspection mistakes
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Is a PPSR Check Enough on Its Own?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              No. It is important, but it is not enough on its own.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A car can return a clean PPSR result and still have poor service
              history, rough road behaviour, hidden repair quality issues, or
              expensive maintenance coming up.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Depending on the price, age, and condition of the vehicle, you may
              also need to decide whether{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                a mechanical inspection is worth it
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What To Do After the PPSR Check
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once you have the result, use it to decide your next step rather
              than treating it as a final answer.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>If something looks wrong, stop and clarify it before proceeding</li>
              <li>If the result looks acceptable, continue to the physical inspection</li>
              <li>Compare the seller’s story with the paperwork and the car itself</li>
              <li>Use what you learn to judge risk and price more clearly</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If you are comparing sale types as well, our guide to{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>{" "}
              can help you think through the risk context.
            </p>

            <p className="text-slate-400 leading-relaxed">
              And once you have assessed the car properly, you may also want to
              review{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car
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
                  Does a PPSR check tell me if the car is mechanically good?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  No. A PPSR check is about history and financial risk, not
                  mechanical condition.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Should I do a PPSR check before inspecting the car in person?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  In many cases, yes. It is a smart early filter because it can
                  rule out major risks before you invest more time in the car.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Do I still need a test drive after a clean PPSR result?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Yes. A clean PPSR result does not tell you how the car drives,
                  how well it has been maintained, or whether it has physical
                  issues that show up during an inspection.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you want a calm, structured way to inspect a used car in
              person,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step by step
              </Link>{" "}
              and turns your observations into a clearer buyer-focused report.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Want to understand the boundaries of what CarVerity does and does
              not do? See{" "}
              <Link
                to="/trust"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                Trust & Transparency
              </Link>
              .
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
                  Used car checklist
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
                  Test drive guide
                </Link>{" · "}
                <Link
                  to="/used-car-inspection-mistakes-australia"
                  className="underline hover:text-white"
                >
                  Inspection mistakes
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
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}