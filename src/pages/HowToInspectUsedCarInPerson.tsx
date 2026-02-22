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
                Run a PPSR check to confirm the vehicle is not under finance or
                written off.
              </li>
              <li>Confirm the VIN matches registration paperwork.</li>
              <li>Request full service history and supporting receipts.</li>
              <li>Check for outstanding recalls.</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              These steps reduce financial risk before you invest time in a
              physical inspection.
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
              <li>
                Be cautious if the engine bay appears excessively cleaned.
              </li>
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
              Electrical repairs can be expensive. Test everything.
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
              If something feels wrong, pause the process. There will always be
              another car.
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

          {/* INTERNAL LINKS */}
          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              For a detailed checklist tailored to Australian buyers, read our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete used car inspection checklist
              </Link>
              .
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
          </section>
        </article>
      </section>
    </div>
  );
}
