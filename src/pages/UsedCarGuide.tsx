import { useEffect } from "react";
import { applySeo } from "../utils/seo";
import { Link } from "react-router-dom";

export default function UsedCarGuide() {
  useEffect(() => {
    applySeo({
      title:
        "What To Check When Buying a Used Car in Australia (What Buyers Miss)",
      description:
        "What should you check before buying a used car in Australia? Use this practical guide to spot red flags, inspect the car properly, run a PPSR check, test drive with confidence, and avoid costly mistakes.",
      canonical:
        "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/what-to-check-when-buying-a-used-car-australia#article",
          headline:
            "What To Check When Buying a Used Car in Australia (What Buyers Miss)",
          description:
            "A practical guide for Australian buyers covering PPSR checks, inspection steps, red flags, test drive checks, and common used car buying mistakes.",
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
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What should you check before buying a used car in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Before buying a used car in Australia, check the PPSR history, confirm the VIN matches the paperwork, review service history, inspect the body and tyres, test all interior features, and take the car on a proper test drive."
              }
            },
            {
              "@type": "Question",
              name: "Is a PPSR check worth doing before buying a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Yes. A PPSR check can help you confirm whether the car is under finance, written off, or recorded as stolen, making it one of the most important checks before purchase."
              }
            },
            {
              "@type": "Question",
              name: "What are the biggest red flags when inspecting a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Common red flags include inconsistent paint, uneven tyre wear, warning lights that stay on, poor service history, suspicious seller behaviour, vibration under braking, rough gear changes, and signs the vehicle may have had previous accident repairs."
              }
            }
          ]
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
            What To Check When Buying a Used Car in Australia
          </h1>

          <p className="text-slate-400 text-base leading-relaxed">
            Buying a used car can feel rushed. The seller is standing there, the
            test drive is short, and it is easy to forget what to look for once
            the pressure starts building.
          </p>

          <p className="text-slate-400 text-base leading-relaxed">
            This guide gives Australian buyers a practical step-by-step way to
            check a used car before purchase, including what to do before you
            arrive, what to look for around the car, what to test inside, and
            what warning signs to take seriously.
          </p>

          <p className="text-slate-400 text-base leading-relaxed">
            If you have been wondering what to check when buying a used car,
            start here and move through the process in order. That alone helps
            reduce missed details.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Quick Answer: What Should You Check Before Buying a Used Car?
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Before buying a used car in Australia, you should check the car’s
            history, confirm the VIN matches the paperwork, review the service
            history, inspect the body and tyres carefully, test the interior
            features, and take it on a proper test drive.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Run a PPSR check</li>
            <li>Confirm VIN and registration details match</li>
            <li>Review service history and receipts</li>
            <li>Inspect paint, panels, tyres and signs of rust</li>
            <li>Test warning lights, air conditioning and electronics</li>
            <li>Drive the car and watch for noises, vibration or poor shifting</li>
            <li>Slow down if anything feels inconsistent or rushed</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Most expensive mistakes happen when buyers skip one of those steps
            or try to do them too quickly.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Before You Inspect the Car</h2>

          <p className="text-slate-400 leading-relaxed">
            Before physically viewing the vehicle, there are a few checks every
            Australian buyer should do first. This helps you avoid wasting time
            on the wrong car.
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
              to see whether the car is under finance, written off or stolen
              recorded
            </li>
            <li>Confirm the VIN matches the registration and seller paperwork</li>
            <li>Ask for service history, logbooks and supporting receipts</li>
            <li>Check whether recalls have been completed</li>
            <li>Ask how long the seller has owned the car</li>
            <li>Ask whether there are any known faults or recent repairs</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            A PPSR check is one of the most important early filters. It can help
            protect you from buying a vehicle with money owing or a serious
            history issue.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Depending on the age, price and condition of the vehicle, you may
            also want to decide whether{" "}
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              a mechanical inspection is worth it in Australia
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What to Check Around the Outside of the Car
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Walk around the vehicle slowly. Do not just look for obvious damage.
            Look for inconsistency. A used car can appear clean while still
            showing clues that something is off.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Check panel gaps and alignment from multiple angles</li>
            <li>Look for mismatched paint or colour variation</li>
            <li>Inspect for dents, scratches and overspray</li>
            <li>Check for rust, especially in lower sections and coastal cars</li>
            <li>Inspect tyre wear across the full width of each tyre</li>
            <li>Check the condition of headlights and tail-lights</li>
            <li>Look at the windscreen for chips or cracks</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Uneven tyre wear can point to suspension, alignment or steering
            issues. Mismatched paint can suggest prior repairs. Neither
            automatically means you should walk away, but both are worth taking
            seriously.
          </p>

          <p className="text-slate-400 leading-relaxed">
            If you want a more detailed walk-through while standing next to the
            vehicle, use our full{" "}
            <Link
              to="/used-car-checklist-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              used car checklist for Australia
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What to Check Inside the Car
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Once inside, do not let a clean cabin distract you from function.
            Cosmetic presentation can hide neglect if you do not test things
            properly.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Make sure dashboard warning lights appear, then switch off</li>
            <li>Test the air conditioning properly, not just for a few seconds</li>
            <li>Check windows, locks and mirrors</li>
            <li>Test infotainment, reversing camera and sensors if fitted</li>
            <li>Look for wear that seems inconsistent with the odometer</li>
            <li>Check for unusual smells, moisture or signs of leaks</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            Heavy seat, steering wheel or pedal wear on a supposedly low-kilometre
            car is worth questioning. It does not prove anything on its own, but
            it is the kind of detail buyers often regret ignoring later.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What to Check During the Test Drive
          </h2>

          <p className="text-slate-400 leading-relaxed">
            The test drive is where a lot of useful information shows up, but it
            is also where many buyers become vague and stop checking
            systematically.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>Does the steering pull to one side?</li>
            <li>Is there vibration under braking?</li>
            <li>Do gear changes feel smooth and normal?</li>
            <li>Do you hear knocks, clunks or whining noises?</li>
            <li>Does the engine feel hesitant or rough?</li>
            <li>Does the temperature stay stable while driving?</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            If you want a more focused driving checklist, read our guide on{" "}
            <Link
              to="/how-to-test-drive-a-used-car-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              how to test drive a used car in Australia
            </Link>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            If you prefer a fuller step-by-step inspection flow before and
            during the drive, see{" "}
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="underline text-white hover:opacity-80 transition"
            >
              how to inspect a used car in person
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Common Red Flags Buyers Miss
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Many buyers do not miss issues because they are careless. They miss
            them because they are excited, rushed or reassured too quickly by a
            tidy-looking car.
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>A seller who discourages checks or rushes the inspection</li>
            <li>Service history that is incomplete or vague</li>
            <li>Paint and panel inconsistencies on one side of the car</li>
            <li>Tyres wearing unevenly</li>
            <li>Warning lights that stay on or behave oddly</li>
            <li>Braking vibration, pulling or drivetrain hesitation</li>
            <li>Answers from the seller that do not line up clearly</li>
          </ul>

          <p className="text-slate-400 leading-relaxed">
            We go deeper on this in our page about{" "}
            <Link
              to="/used-car-inspection-mistakes-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              common used car inspection mistakes in Australia
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Dealer or Private Seller: Does It Change What You Check?
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Yes. The core inspection steps stay the same, but the risks can feel
            different depending on who is selling the car.
          </p>

          <p className="text-slate-400 leading-relaxed">
            A dealer may offer more presentation and some extra reassurance, but
            that does not remove the need for proper checks. A private sale can
            sometimes offer better value, but often gives you less room for
            comeback if something goes wrong.
          </p>

          <p className="text-slate-400 leading-relaxed">
            If you are weighing that up, compare the pros and cons in our guide
            to{" "}
            <Link
              to="/dealer-vs-private-seller-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              dealer vs private seller in Australia
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            What to Do if You Find Issues
          </h2>

          <p className="text-slate-400 leading-relaxed">
            Finding issues does not always mean the car is a hard no. It means
            you need to slow down, document what you found and decide whether
            the risk matches the asking price.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Minor cosmetic issues may simply support negotiation. More serious
            signs like poor history, finance concerns, repair inconsistency or
            bad driving behaviour may justify walking away.
          </p>

          <p className="text-slate-400 leading-relaxed">
            If you are trying to work out the next step on price, read our guide
            on{" "}
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              how much you should offer on a used car in Australia
            </Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            A Simple Way to Avoid Missing Things
          </h2>

          <p className="text-slate-400 leading-relaxed">
            One of the biggest problems during a used car inspection is not lack
            of effort. It is lack of structure. Buyers often know some of what
            to look for, but they forget checks in the moment.
          </p>

          <p className="text-slate-400 leading-relaxed">
            That is why many buyers use a checklist while they inspect. If you
            want something you can follow more easily, you can use our{" "}
            <Link
              to="/used-car-checklist-printable"
              className="underline text-white hover:opacity-80 transition"
            >
              printable used car checklist
            </Link>{" "}
            or the more detailed{" "}
            <Link
              to="/used-car-checklist-australia"
              className="underline text-white hover:opacity-80 transition"
            >
              used car checklist for Australia
            </Link>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            Tools like{" "}
            <Link
              to="/"
              className="text-white underline underline-offset-4 hover:opacity-80 transition"
            >
              CarVerity
            </Link>{" "}
            are built around that same idea: guiding buyers through the process
            calmly, helping them document what they see, and reducing the chance
            of missing something important while standing next to the car.
          </p>
        </section>

        <section className="space-y-4 pt-10 border-t border-slate-800">
          <h2 className="text-xl font-semibold">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                What should I check first when buying a used car?
              </h3>
              <p className="text-slate-400 leading-relaxed mt-2">
                Start with the car’s history and paperwork before you become
                emotionally invested. A PPSR check, VIN confirmation and service
                history review can rule out major issues early.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">
                Is a PPSR check enough on its own?
              </h3>
              <p className="text-slate-400 leading-relaxed mt-2">
                No. A PPSR check is important, but it does not replace a proper
                physical inspection, test drive or review of the service
                history.
              </p>
            </div>

            <div>
              <h3 className="text-base font-semibold text-white">
                Should I still inspect a car if it looks clean?
              </h3>
              <p className="text-slate-400 leading-relaxed mt-2">
                Yes. Clean presentation does not always mean good condition.
                Buyers often miss problems because the car looks tidy and the
                seller seems confident.
              </p>
            </div>
          </div>
        </section>

        <section className="pt-6 space-y-3 text-sm text-slate-500">
          <p className="font-semibold text-slate-400">
            Related used car buying guides in Australia:
          </p>

          <p className="leading-relaxed">
            <Link
              to="/ppsr-check-australia"
              className="underline hover:text-white"
            >
              PPSR check Australia
            </Link>{" · "}
            <Link
              to="/how-to-inspect-a-used-car-in-person"
              className="underline hover:text-white"
            >
              How to inspect a used car in person
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
              Used car inspection mistakes
            </Link>{" · "}
            <Link
              to="/used-car-checklist-australia"
              className="underline hover:text-white"
            >
              Used car checklist Australia
            </Link>{" · "}
            <Link
              to="/used-car-checklist-printable"
              className="underline hover:text-white"
            >
              Printable used car checklist
            </Link>{" · "}
            <Link
              to="/is-a-mechanical-inspection-worth-it-australia"
              className="underline hover:text-white"
            >
              Is a mechanical inspection worth it?
            </Link>{" · "}
            <Link
              to="/dealer-vs-private-seller-australia"
              className="underline hover:text-white"
            >
              Dealer vs private seller
            </Link>{" · "}
            <Link
              to="/how-much-should-you-offer-used-car-australia"
              className="underline hover:text-white"
            >
              How much should you offer?
            </Link>
          </p>
        </section>
      </article>
    </div>
  );
}