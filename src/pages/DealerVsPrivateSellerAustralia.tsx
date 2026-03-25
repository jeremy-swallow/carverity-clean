import { useEffect } from "react";
import { Link } from "react-router-dom";
import { applySeo } from "../utils/seo";

export default function DealerVsPrivateSellerAustralia() {
  useEffect(() => {
    applySeo({
      title:
        "Dealer vs Private Seller (Used Car Australia): Pros, Cons & Safer Option",
      description:
        "Dealer or private seller? Learn the real risks, price differences, legal protection, and which option is safer when buying a used car in Australia.",
      canonical:
        "https://www.carverity.com.au/dealer-vs-private-seller-australia",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "@id":
            "https://www.carverity.com.au/dealer-vs-private-seller-australia#article",
          headline:
            "Dealer vs Private Seller (Used Car Australia): Pros, Cons & Safer Option",
          description:
            "A practical Australian guide comparing dealers and private sellers when buying a used car, including pricing, legal protections, inspection risk, and which option is safer.",
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
            "https://www.carverity.com.au/dealer-vs-private-seller-australia",
          inLanguage: "en-AU",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is it better to buy a used car from a dealer or a private seller in Australia?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "If you want lower risk and stronger legal protection, buying from a dealer is usually safer. If you want a lower price and are comfortable handling more of the inspection risk yourself, a private seller may offer better value.",
              },
            },
            {
              "@type": "Question",
              name: "Are used cars cheaper from private sellers?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Often yes. Private sellers are usually cheaper than dealers, but the lower price generally comes with fewer protections and more buyer responsibility.",
              },
            },
            {
              "@type": "Question",
              name: "Do I still need to inspect a used car if I buy from a dealer?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Yes. Buying from a dealer can reduce some risk, but it does not remove the need for a PPSR check, a proper inspection, service history review, and a test drive.",
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
              name: "Dealer vs Private Seller",
              item:
                "https://www.carverity.com.au/dealer-vs-private-seller-australia",
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
              Dealer vs Private Seller: Which Is Better When Buying a Used Car in Australia?
            </h1>

            <p className="text-slate-400 leading-relaxed">
              When buying a used car in Australia, one of the biggest decisions
              is whether to buy from a licensed dealer or a private seller.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Each option has advantages, risks, and different levels of buyer
              protection. The better choice depends on your budget, your risk
              tolerance, and how confident you are inspecting a used car
              properly.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This guide compares the two clearly so you can decide which option
              is safer, where the trade-offs are, and what still needs checking
              before you commit.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Quick Answer: Dealer vs Private Seller in Australia
            </h2>

            <p className="text-slate-400 leading-relaxed">
              If you want lower risk and stronger legal protection, buying from
              a dealer is usually the safer option. If you want a lower price
              and are comfortable handling more inspection risk yourself, a
              private seller may offer better value.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Dealer = usually safer, usually more expensive</li>
              <li>Private seller = usually cheaper, usually higher risk</li>
              <li>Both still require proper inspection and due diligence</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              No matter where you buy, you should still follow a structured
              process. Start with our{" "}
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
              Price: Dealers Are Usually More Expensive
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Vehicles sold by dealers are usually priced higher than similar
              cars sold privately. That extra cost often reflects more than just
              profit.
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>Dealer overhead costs</li>
              <li>Compliance and business operating costs</li>
              <li>Warranty or statutory obligations where applicable</li>
              <li>Reconditioning, cleaning, and presentation</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Private sellers may offer lower prices, but the lower upfront cost
              often comes with fewer protections and more responsibility on the
              buyer.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Regardless of where you buy, understanding{" "}
              <Link
                to="/how-much-should-you-offer-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                how much to offer on a used car in Australia
              </Link>{" "}
              can make a real difference to your final outcome.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Legal Protection: Dealers Usually Offer More
            </h2>

            <p className="text-slate-400 leading-relaxed">
              One of the biggest differences between a dealer and a private
              seller is the level of protection available if something goes
              wrong.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Buying From a Dealer
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300 mt-3">
                  <li>May include statutory warranty depending on the vehicle</li>
                  <li>Usually comes with clearer paperwork processes</li>
                  <li>Can offer a more formal complaint pathway</li>
                  <li>Often feels more structured for cautious buyers</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Buying From a Private Seller
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-slate-300 mt-3">
                  <li>No statutory warranty in most cases</li>
                  <li>Limited protection if the car turns out problematic</li>
                  <li>More buyer responsibility for checking everything properly</li>
                  <li>Greater reliance on your own judgement and diligence</li>
                </ul>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed">
              If your main priority is reducing risk and having more formal
              protections around the sale, a dealer often has the advantage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Inspection Risk: Both Still Require Due Diligence
            </h2>

            <p className="text-slate-400 leading-relaxed">
              A lot of buyers assume dealers are automatically safe and private
              sellers are automatically risky. Real life is not that simple.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Whether buying from a dealer or a private seller, you should
              still:
            </p>

            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                Run a{" "}
                <Link
                  to="/ppsr-check-australia"
                  className="text-white underline underline-offset-4 hover:opacity-80 transition"
                >
                  PPSR check in Australia
                </Link>
              </li>
              <li>Conduct a structured in-person inspection</li>
              <li>Test drive the car properly</li>
              <li>Review service history and supporting records</li>
            </ul>

            <p className="text-slate-400 leading-relaxed">
              Dealers are not immune to oversights, and private sellers are not
              automatically dishonest. Risk exists in both environments, which
              is why your process matters so much.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Depending on the vehicle, you may also want to consider whether{" "}
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
              Negotiation: Private Sellers Are Often More Flexible
            </h2>

            <p className="text-slate-400 leading-relaxed">
              Private sellers are often more flexible on price, especially if
              they are motivated to sell quickly or want a simple transaction.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Dealers may negotiate too, but the process is often more
              structured and sometimes less flexible than buyers expect.
            </p>

            <p className="text-slate-400 leading-relaxed">
              This does not always mean private is better. It means the lower
              entry price and greater negotiating room often comes with higher
              buyer responsibility.
            </p>

            <p className="text-slate-400 leading-relaxed">
              If you want to reduce mistakes in this stage, read our guide to{" "}
              <Link
                to="/used-car-inspection-mistakes-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                common used car inspection mistakes in Australia
              </Link>
              .
            </p>
          </section>

          <section className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                When a Dealer May Be the Better Choice
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>You want stronger legal protection</li>
                <li>You prefer more structured paperwork</li>
                <li>You are more risk-averse</li>
                <li>You are comfortable paying more for reassurance</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                When a Private Seller May Be the Better Choice
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-slate-300">
                <li>You are more price-sensitive</li>
                <li>You are confident inspecting vehicles carefully</li>
                <li>You are comfortable handling more of the process yourself</li>
                <li>You accept more risk in exchange for potential savings</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              So Which Option Is Safer?
            </h2>

            <p className="text-slate-400 leading-relaxed">
              In general, buying from a dealer is usually the safer option
              because you are more likely to have stronger paperwork, clearer
              sale processes, and better protection if something goes wrong.
            </p>

            <p className="text-slate-400 leading-relaxed">
              But safer does not always mean better value. A careful buyer can
              still do very well buying privately, especially if they inspect
              properly, check the history, and stay disciplined.
            </p>

            <p className="text-slate-400 leading-relaxed">
              The right choice depends on whether you value lower risk more than
              lower price.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">
              Structure Reduces Risk in Both Cases
            </h2>

            <p className="text-slate-400 leading-relaxed">
              The environment can influence pressure. A dealer yard can feel
              polished and reassuring. A private driveway can feel casual and
              personal. Either setting can affect your judgement if you are not
              careful.
            </p>

            <p className="text-slate-400 leading-relaxed">
              A structured inspection process helps you stay objective in both
              situations. It slows the process down and makes it easier to spot
              inconsistencies before you commit.
            </p>

            <p className="text-slate-400 leading-relaxed">
              Review our{" "}
              <Link
                to="/how-to-inspect-a-used-car-in-person"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                step-by-step inspection guide
              </Link>{" "}
              and our{" "}
              <Link
                to="/what-to-check-when-buying-a-used-car-australia"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                complete Australian used car checklist
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
                  Is it safer to buy from a dealer than a private seller?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Usually yes. Dealers generally offer more structure and more
                  buyer protection, although you should still inspect the car
                  properly.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Are private sellers usually cheaper?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Often yes. Private sellers are commonly cheaper than dealers,
                  but the lower price usually comes with fewer protections and
                  more buyer responsibility.
                </p>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Do I still need a PPSR check if I buy from a dealer?
                </h3>
                <p className="text-slate-400 leading-relaxed mt-2">
                  Yes. A PPSR check is still a smart part of the process,
                  regardless of who is selling the car.
                </p>
              </div>
            </div>
          </section>

          <section className="pt-10 border-t border-slate-800 space-y-4">
            <p className="text-slate-400 leading-relaxed">
              If you prefer a calm, structured mobile inspection flow,{" "}
              <Link
                to="/"
                className="text-white underline underline-offset-4 hover:opacity-80 transition"
              >
                CarVerity guides you step by step
              </Link>{" "}
              and helps you document what you observe before committing.
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
                  to="/ppsr-check-australia"
                  className="underline hover:text-white"
                >
                  PPSR check Australia
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