// src/pages/Pricing.tsx

import { useNavigate } from "react-router-dom";

type Pack = {
  id: string;
  title: string;
  scans: number;
  price: string;
  highlight?: boolean;
  description: string;
};

const PACKS: Pack[] = [
  {
    id: "single",
    title: "Single scan",
    scans: 1,
    price: "$14.99",
    description:
      "Best for a one-off check. Includes full buyer report, photos, and negotiation positioning.",
  },
  {
    id: "triple",
    title: "3 scan pack",
    scans: 3,
    price: "$39",
    highlight: true,
    description:
      "Most popular. Ideal if you’re comparing a few cars during your search.",
  },
  {
    id: "five",
    title: "5 scan pack",
    scans: 5,
    price: "$59",
    description:
      "Best value. Designed for active buyers inspecting multiple vehicles.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  function handlePurchase(pack: Pack) {
    /**
     * IMPORTANT:
     * This page does NOT enforce credits.
     * It simply routes intent to Stripe.
     *
     * You already have Stripe flows in place.
     * Wire these IDs to your existing checkout logic.
     */
    if (pack.id === "single") {
      navigate("/scan/in-person/unlock");
      return;
    }

    // Placeholder route for credit packs (to be wired to Stripe Checkout)
    navigate(`/checkout/credits?pack=${pack.id}`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="space-y-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-white">
          Pricing
        </h1>

        <p className="text-slate-300 text-lg leading-relaxed">
          CarVerity helps you make confident buying decisions by guiding you
          through an in-person inspection and turning what you record into a
          clear, buyer-safe report.
        </p>
      </header>

      {/* =====================================================
          PACKS
      ===================================================== */}
      <section className="grid gap-6 md:grid-cols-3">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={[
              "rounded-2xl border px-6 py-8 space-y-6",
              pack.highlight
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-white/10 bg-slate-900/60",
            ].join(" ")}
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">
                {pack.title}
              </h2>

              <p className="text-slate-300 text-sm">
                {pack.description}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-bold text-white">
                {pack.price}
              </p>

              <p className="text-xs text-slate-400">
                {pack.scans} scan{pack.scans > 1 ? "s" : ""}
              </p>
            </div>

            <button
              onClick={() => handlePurchase(pack)}
              className={[
                "w-full rounded-xl px-5 py-3 font-semibold transition-colors",
                pack.highlight
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-slate-800 text-white hover:bg-slate-700",
              ].join(" ")}
            >
              {pack.id === "single"
                ? "Buy single scan"
                : "Buy scan pack"}
            </button>
          </div>
        ))}
      </section>

      {/* =====================================================
          WHAT YOU GET
      ===================================================== */}
      <section className="max-w-3xl space-y-4">
        <h3 className="text-lg font-semibold text-white">
          What every scan includes
        </h3>

        <ul className="list-disc list-inside space-y-2 text-slate-300 text-sm">
          <li>Guided in-person inspection flow</li>
          <li>Buyer-captured photo evidence</li>
          <li>Clear explanation of why the verdict was reached</li>
          <li>Risk weighting based only on what you recorded</li>
          <li>Buyer-safe negotiation positioning</li>
          <li>Printable, dealer-ready report</li>
        </ul>
      </section>

      {/* =====================================================
          FOOTNOTE
      ===================================================== */}
      <footer className="max-w-3xl text-xs text-slate-400 leading-relaxed">
        Scans are designed to support buying decisions and discussions.
        CarVerity does not perform mechanical inspections and does not assume
        conditions that were not observed or recorded.
      </footer>
    </div>
  );
}
