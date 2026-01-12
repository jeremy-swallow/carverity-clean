// src/pages/Pricing.tsx

import { useNavigate } from "react-router-dom";

type Pack = {
  id: "single" | "triple" | "five";
  title: string;
  scans: number;
  priceLabel: string;
  stripePriceId?: string;
  highlight?: boolean;
  description: string;
};

/* =========================================================
   Stripe price IDs (AUD, one-time)
========================================================= */

const STRIPE_PRICES = {
  single: "price_1So9TcE9gXaXx1nSyeYvpaQb",
  triple: "price_1SoppbE9gXaXx1nSfp5Xex9O",
  five: "price_1SoprRE9gXaXx1nSnlKEnh0U",
};

const PACKS: Pack[] = [
  {
    id: "single",
    title: "Single scan",
    scans: 1,
    priceLabel: "$14.99",
    description:
      "Best for a one-off check. Includes the full buyer report, photos, and negotiation positioning.",
  },
  {
    id: "triple",
    title: "3 scan pack",
    scans: 3,
    priceLabel: "$39",
    stripePriceId: STRIPE_PRICES.triple,
    highlight: true,
    description:
      "Most popular. Ideal if you’re comparing a few vehicles during your search.",
  },
  {
    id: "five",
    title: "5 scan pack",
    scans: 5,
    priceLabel: "$59",
    stripePriceId: STRIPE_PRICES.five,
    description:
      "Best value for active buyers inspecting multiple cars.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  async function handlePurchase(pack: Pack) {
    // Existing, proven single-scan flow — do not change
    if (pack.id === "single") {
      navigate("/scan/in-person/unlock");
      return;
    }

    if (!pack.stripePriceId) return;

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: pack.stripePriceId,
          mode: "payment",
        }),
      });

      if (!res.ok) {
        throw new Error("checkout-session-failed");
      }

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      alert(
        "Something went wrong while starting checkout. Please try again."
      );
    }
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
          CarVerity guides you through an in-person inspection and turns what you
          record into a clear, buyer-safe report you can confidently rely on.
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
                {pack.priceLabel}
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
          Every scan includes
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
        CarVerity does not perform mechanical inspections and does not assume
        conditions that were not observed or recorded.
      </footer>
    </div>
  );
}
