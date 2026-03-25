import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function UsedCarChecklistAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "Used Car Checklist Australia (What to Check Before You Buy)",
      description:
        "Use this practical used car checklist in Australia to inspect a car properly before you buy. Includes history checks, exterior, interior, test drive checks, red flags, and a printable checklist option.",
      canonical: "https://www.carverity.com.au/used-car-checklist-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/used-car-checklist-australia#article",
          headline:
            "Used Car Checklist Australia (What to Check Before You Buy)",
          description:
            "A practical Australian used car checklist covering history checks, exterior, interior, test drive checks, common red flags, and a printable checklist option.",
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
            "https://www.carverity.com.au/used-car-checklist-australia",
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What should be on a used car checklist in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "A used car checklist in Australia should include a PPSR check, VIN and registration confirmation, service history review, exterior checks, interior and electronics checks, a proper test drive, and a final review after the drive for leaks, smells, warning lights, and red flags.",
              },
            },
            {
              "@type": "Question",
              name: "Is a used car checklist worth using?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Yes. A used car checklist helps buyers stay structured, reduce pressure, and avoid missing important details during an inspection.",
              },
            },
            {
              "@type": "Question",
              name: "Should I use a printable checklist or an app?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "A printable checklist can be useful as a simple fallback, but a guided app can be easier during the inspection because it helps you move through the process step by step and record what you notice.",
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
              name: "Used Car Checklist Australia",
              item: "https://www.carverity.com.au/used-car-checklist-australia",
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
              Used Car Checklist Australia
            </h1>

            <p className="text-slate-400 leading-relaxed">
              Buying a used car can feel fine right up until something expensive
              shows up later. Most buyers do not miss issues because they are
              careless. They miss them because inspections often happen quickly,
              under pressure, and in unfamiliar environments.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This used car checklist is designed for real-world use in
              Australia. It gives you a practical structure to follow before you
              buy, including what to check outside the car, inside the cabin,
              during the test drive, and immediately afterwards.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you have been searching for a simple used car checklist you can
              actually use while standing next to the vehicle, this page is
              built for that.
            </p>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <h2 className="text-lg font-semibold text-white">
                Want a version you can print?
              </h2>

              <p className="mt-3 text-slate-300 leading-relaxed">
                If you prefer something simple on paper, use the{" "}
                <Link
                  to="/used-car-checklist-printable"
                  className="text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  printable used car checklist
                </Link>
                .
              </p>

              <p className="mt-3 text-slate-300 leading-relaxed">
                For the stronger option while standing next to the car,{" "}
                <Link
                  to="/"
                  className="text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  CarVerity guides you step by step
                </Link>{" "}
                and helps you capture photos, stay structured, and finish with a
                clearer report.
              </p>
            </div>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: What Should a Used Car Checklist Include?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A used car checklist in Australia should include the vehicle
              history, VIN and registration checks, service history, exterior
              condition, interior and electronics, a proper test drive, and a
              final post-drive review for leaks, smells, warning lights, and
              anything that felt inconsistent.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Check the history before you inspect the car</li>
              <li>Walk around the exterior slowly and look for inconsistency</li>
              <li>Test the cabin features properly</li>
              <li>Drive the car with a purpose, not just briefly</li>
              <li>Review the car again after the drive</li>
              <li>Write down anything that feels off</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              The reason this matters is simple: structure helps you notice what
              pressure makes easy to miss.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Used Car Checklist
            </h2>

            <p className="text-slate-400 leading-relaxed">
              If you want a simple used car checklist you can quickly scan on
              your phone while standing next to the vehicle, start here.
            </p>

            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Before You Arrive</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>
                    Run a{" "}
                    <Link
                      to="/ppsr-check-australia"
                      className="text-white underline underline-offset-4 hover:opacity-80 transition"
                    >
                      PPSR check in Australia
                    </Link>{" "}
                    to check for finance owing, stolen status, or write-off
                    history
                  </li>
                  <li>Ask for service history and receipts</li>
                  <li>Confirm the VIN and registration details match</li>
                  <li>Decide in advance whether a mechanic inspection may be needed</li>
                  <li>Ask direct questions about faults and recent repairs</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Exterior</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Check for dents, scratches, and mismatched paint</li>
                  <li>Look for uneven panel gaps</li>
                  <li>Inspect tyres for even wear and usable tread depth</li>
                  <li>Look for rust around doors, wheel arches, and lower panels</li>
                  <li>Check lights, glass, and mirrors for damage</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Interior</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Check seat wear against the car’s age and kilometres</li>
                  <li>Test windows, locks, mirrors, and buttons</li>
                  <li>Check dashboard warning lights on startup</li>
                  <li>Test air conditioning, infotainment, and reverse camera</li>
                  <li>Look for signs of water damage or unusual smells</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Under the Bonnet (Visual Only)
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Look for visible leaks or wet areas</li>
                  <li>Check battery terminals for corrosion</li>
                  <li>Inspect hoses for obvious cracking or wear</li>
                  <li>Be cautious if the engine bay looks freshly cleaned</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Test Drive</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Check for smooth acceleration without hesitation</li>
                  <li>See whether braking feels straight and stable</li>
                  <li>Notice if the steering pulls, feels vague, or vibrates</li>
                  <li>Listen for knocks, rattles, whining, or clunks</li>
                  <li>Check that gear changes feel smooth</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">After the Drive</h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300">
                  <li>Check for new warning lights</li>
                  <li>Look under the car for leaks</li>
                  <li>Notice any burning smell or unusual odour</li>
                  <li>Do one final walk-around before making any decision</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Why a Used Car Checklist Matters
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A checklist helps you slow down and inspect the car in a more
              structured way. That matters because many buyers rely too heavily
              on first impressions. If a used car looks clean and the seller
              sounds confident, it is easy to assume the rest is fine.
            </p>

            <p className="text-slate-400 leading-relaxed">
              In reality, some of the most expensive problems show up in small
              details: uneven tyre wear, warning lights, rough idle, poor
              braking feel, or strange noises during the drive.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want a more detailed walkthrough of the physical inspection
              itself, read our guide on{" "}
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
              Exterior Checklist: What to Look For
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Start by walking around the car slowly. Do not focus only on major
              damage. What you are really looking for is inconsistency.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Mismatched paint can suggest previous repair work</li>
              <li>Uneven panel gaps can point to accident repairs or poor fitment</li>
              <li>Rust around lower panels can worsen quickly if ignored</li>
              <li>Uneven tyre wear may indicate suspension or alignment issues</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If the seller brushes off visible issues too casually, take note.
              Small cosmetic problems do not always mean the car is bad, but
              they can tell you something about how it has been treated.
            </p>

            <p className="text-slate-400 leading-relaxed">
              For the broader hub page tying all of these checks together, see{" "}
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
              Interior Checklist: Cabin, Electronics and Dashboard
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The interior can reveal how the car has been used and maintained.
              Excessive wear, odd smells, warning lights, or non-working
              electronics can all become expensive later.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Make sure warning lights appear at startup and then clear</li>
              <li>Test air conditioning properly, not just for a few seconds</li>
              <li>Check all windows, locks, mirrors, and seat adjustments</li>
              <li>Confirm the odometer makes sense with the overall wear</li>
              <li>Be cautious if something feels heavily worn for the stated kilometres</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Clean presentation can create false confidence. Function matters
              more than appearance here.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Test Drive Checklist: What to Notice
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The test drive is where many used car issues become easier to
              notice. Avoid doing only a quick lap around the block if you can.
              Try low-speed streets, some braking, turning, and a slightly
              higher-speed section where safe and legal.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Does the engine accelerate cleanly?</li>
              <li>Does the steering stay straight without constant correction?</li>
              <li>Is there vibration under braking?</li>
              <li>Do gear changes feel smooth or delayed?</li>
              <li>Are there clunks over bumps or unusual humming sounds?</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              For a more focused drive-specific guide, see{" "}
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
              Common Used Car Inspection Mistakes
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A used car checklist only helps if you use it properly. The most
              common mistakes include:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Rushing because the seller seems impatient</li>
              <li>Letting a clean exterior create false confidence</li>
              <li>Skipping or shortening the test drive</li>
              <li>Ignoring minor noises or warning signs</li>
              <li>Failing to check the car’s history before inspecting it</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              You can also read our full breakdown of{" "}
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
              Printable Used Car Checklist
            </h2>

            <p className="text-slate-400 leading-relaxed">
              If you want something simple to use while standing next to the
              vehicle, you can use our{" "}
              <Link
                to="/used-car-checklist-printable"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                printable checklist version
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              It is designed as a simplified paper-friendly fallback. The guided
              app experience is still the stronger option if you want structure,
              photo capture, saved progress, and a clearer summary at the end.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Want a Guided Inspection Instead?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A written checklist helps, but remembering everything while
              talking to a seller and checking the car can still be difficult.
            </p>

            <p className="text-slate-400 leading-relaxed">
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step by step
              </Link>{" "}
              through an in-person used car inspection and helps you turn your
              observations into a clearer summary you can review afterwards.
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  What should I check first on a used car?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Start with the history and paperwork before you become too
                  invested. A PPSR check, VIN confirmation, and service history
                  review can rule out major problems early.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Is a used car checklist enough on its own?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  It is a strong start, but it does not replace good judgement,
                  proper follow-up questions, or a mechanical inspection where
                  the car or situation justifies it.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Should I still use a checklist if the car looks clean?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Yes. Clean presentation is exactly what causes many buyers to
                  relax too early and miss issues they would otherwise have
                  noticed.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              For a broader overview, read our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                guide to what to check when buying a used car in Australia
              </Link>
              .
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are still deciding how cautious you need to be, compare{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller in Australia
              </Link>{" "}
              or read{" "}
              <Link
                to="/is-a-mechanical-inspection-worth-it-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                whether a mechanical inspection is worth it
              </Link>
              .
            </p>

            <div className="pt-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-400">
                Related used car buying guides (Australia):
              </p>
              <p className="leading-relaxed">
                <Link
                  to="/used-car-checklist-printable"
                  className="underline hover:text-white"
                >
                  Printable checklist
                </Link>{" · "}
                <Link
                  to="/what-to-check-when-buying-a-used-car-australia"
                  className="underline hover:text-white"
                >
                  What to check when buying
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
                  to="/ppsr-check-australia"
                  className="underline hover:text-white"
                >
                  PPSR check Australia
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
                  Dealer vs private seller
                </Link>
              </p>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}