import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function HowMuchShouldYouOfferUsedCarAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "How Much Should You Offer on a Used Car? (Australia Buyer Guide)",
      description:
        "Not sure how much to offer on a used car in Australia? Learn how to calculate a fair offer, adjust for condition, factor in risk, and avoid paying too much.",
      canonical:
        "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia#article",
          headline:
            "How Much Should You Offer on a Used Car? (Australia Buyer Guide)",
          description:
            "A practical Australian guide explaining how buyers can work out a fair used car offer by comparing market value, condition, and risk.",
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
            "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How much should you offer on a used car in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Start with the market value of similar cars, then adjust your offer based on condition, service history, defects, and overall risk. A fair offer is usually based on evidence, not guesswork.",
              },
            },
            {
              "@type": "Question",
              name: "Should you offer less than the asking price on a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Often yes, but it depends on demand, pricing accuracy, and the condition of the car. If the car is already priced sharply and presents well, there may be less room. If it has defects or uncertainty, a lower offer is easier to justify.",
              },
            },
            {
              "@type": "Question",
              name: "What affects how much you should offer on a used car?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "The main factors are market value, kilometres, service history, tyre and brake condition, cosmetic damage, seller type, mechanical concerns, and how much uncertainty remains after inspection.",
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
              name: "Used Car Negotiation Guide",
              item:
                "https://www.carverity.com.au/how-much-should-you-offer-used-car-australia",
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
              How Much Should You Offer on a Used Car in Australia?
            </h1>

            <p className="text-slate-400 leading-relaxed">
              One of the most common questions buyers ask is:
              <strong> “How much should I offer?”</strong>
            </p>

            <p className="text-slate-400 leading-relaxed">
              Offer too low and you may lose the car or annoy the seller. Offer
              too high and you can easily overpay by thousands. The right number
              is usually not a guess. It is something you work out from the
              market, the condition of the car, and the risk you are taking on.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide shows you how to calculate a fair used car offer in
              Australia without relying on emotion, pressure, or the seller’s
              confidence.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: How Much Should You Offer on a Used Car?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Start with the market value of similar cars, then adjust your
              offer based on the car’s actual condition, service history,
              kilometres, and any uncertainty you found during the inspection.
              A fair offer is based on evidence, not optimism.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Start with comparable listings</li>
              <li>Adjust for defects and wear</li>
              <li>Reduce further if history or seller confidence is weak</li>
              <li>Stay calm and explain your logic clearly</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Before calculating your number, make sure you have already worked
              through a proper inspection. Start with our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                full used car inspection checklist for Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 1: Start With Market Value
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Before negotiating, compare the car with similar listings already
              on the market. This gives you a baseline range before emotions or
              seller pressure get involved.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Same make and model</li>
              <li>Similar kilometres</li>
              <li>Comparable condition</li>
              <li>Same state or local market where possible</li>
              <li>Similar service history and trim level if relevant</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If the asking price already looks sharp compared with similar
              cars, there may be less room to negotiate aggressively. If it is
              clearly above the market, you already have a stronger case for a
              lower offer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Step 2: Adjust for Condition
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Once you have a market baseline, adjust your offer based on what
              you actually found during the inspection.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Tyre wear</li>
              <li>Brake condition</li>
              <li>Cosmetic damage</li>
              <li>Service gaps</li>
              <li>Mechanical concerns</li>
              <li>Interior wear or non-working features</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Even smaller issues can justify price movement when they are calm,
              real, and easy to explain. The key is to base your reasoning on
              observable details rather than vague dissatisfaction.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you are unsure how to structure your findings, review our{" "}
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
              Step 3: Factor in Risk, Not Just Visible Problems
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Not all risk is visible. A car might look acceptable but still
              carry uncertainty that should affect what you are willing to pay.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Incomplete or unclear service history</li>
              <li>Seller answers that feel vague or inconsistent</li>
              <li>Signs the car may not have been well looked after</li>
              <li>Concerns that still feel unresolved after inspection</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              That uncertainty is part of the value equation. If you are taking
              on more unknowns, your offer should usually reflect that.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Always run a{" "}
              <Link
                to="/ppsr-check-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                PPSR check in Australia
              </Link>{" "}
              before you finalise numbers.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Depending on the age and complexity of the car, you may also want
              to consider whether{" "}
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
              Dealer vs Private Seller Negotiation
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The type of seller can affect how much flexibility you are likely
              to get.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Private sellers are often more flexible, especially if they are
              motivated to sell or want the process finished quickly. Dealers
              may still negotiate, but the process is usually more structured
              and sometimes less flexible than buyers hope.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want to understand how seller type changes your pricing
              strategy, read our{" "}
              <Link
                to="/dealer-vs-private-seller-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                dealer vs private seller comparison
              </Link>
              .
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              What Is a Typical Negotiation Range?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              In Australia, negotiation often lands somewhere in a modest range,
              but it depends heavily on demand, pricing accuracy, and how
              cleanly the car presents.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Higher-demand vehicles usually have less room</li>
              <li>Private sales can be more flexible</li>
              <li>Cars with defects or uncertainty justify larger adjustments</li>
              <li>Well-priced cars may have very little movement</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              The important thing is not chasing an arbitrary discount. It is
              reaching a number that makes sense based on the evidence in front
              of you.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Many buyers weaken their position by becoming reactive too early.
              Read our guide to{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                common used car inspection mistakes in Australia
              </Link>{" "}
              if you want to avoid that.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Use Structure, Not Emotion
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Emotional negotiation usually leads to poor decisions. Buyers get
              attached, feel awkward, rush themselves, or start justifying the
              car because they want the purchase to work out.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A stronger approach is to:
            </p>

            <ol className="list-decimal pl-6 space-y-2 text-slate-300">
              <li>Check the market</li>
              <li>Inspect the car properly</li>
              <li>List what affects value</li>
              <li>Factor in unresolved risk</li>
              <li>Present a calm, logical number</li>
            </ol>

            <p className="text-slate-400 leading-relaxed">
              That is why it helps to review our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete Australian used car checklist
              </Link>{" "}
              before deciding what to offer.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              A Simple Way to Think About Your Offer
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A practical offer usually sits somewhere in this logic:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Start with what similar cars are selling for</li>
              <li>Subtract realistic adjustments for condition</li>
              <li>Subtract more if important uncertainty remains</li>
              <li>Decide whether the final number still feels worth it to you</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              If the seller will not move and the risk still feels too high, the
              answer may simply be to walk away.
            </p>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Should I always offer below the asking price?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Often yes, but not blindly. The better question is whether the
                  asking price is already fair for the market and condition.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  How do I justify a lower offer on a used car?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Use specific reasons such as tyre wear, cosmetic damage,
                  service gaps, unclear history, or other inspection findings
                  that affect value.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  What if the seller will not negotiate?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Then you need to decide whether the current price still makes
                  sense for the car and the risk involved. Sometimes the best
                  negotiation move is walking away.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you prefer a structured way to assess condition and calculate
              negotiation leverage,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity helps you document issues and position price more logically
              </Link>
              .
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
                  to="/ppsr-check-australia"
                  className="underline hover:text-white"
                >
                  PPSR check Australia
                </Link>{" · "}
                <Link
                  to="/dealer-vs-private-seller-australia"
                  className="underline hover:text-white"
                >
                  Dealer vs private seller
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
                </Link>
              </p>
            </div>
          </section>
        </article>
      </section>
    </div>
  );
}