import { useState } from "react";
import { supabase } from "../supabaseClient";

type PriceOption = {
  id: string;
  label: string;
  price: string;
  description: string;
};

const PRICES: PriceOption[] = [
  {
    id: "price_1So9TcE9gXaXx1nSyeYvpaQb",
    label: "Single scan",
    price: "$14.99",
    description: "Best for a one-off check.",
  },
  {
    id: "price_1SoppbE9gXaXx1nSfp5Xex9O",
    label: "3 scan pack",
    price: "$39",
    description: "Most popular.",
  },
  {
    id: "price_1SoprRE9gXaXx1nSnlKEnh0U",
    label: "5 scan pack",
    price: "$59",
    description: "Best value.",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(priceId: string) {
    try {
      setLoading(priceId);

      // Get authenticated Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("You must be logged in to purchase scan credits.");
        setLoading(null);
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        throw new Error(`Checkout failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.url) {
        throw new Error("Missing Stripe checkout URL");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong while starting checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Pricing
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICES.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col"
          >
            <h2 className="text-lg font-semibold text-white">
              {p.label}
            </h2>

            <p className="text-slate-400 mt-2">
              {p.description}
            </p>

            <div className="text-3xl font-bold text-white mt-4">
              {p.price}
            </div>

            <button
              onClick={() => startCheckout(p.id)}
              disabled={loading === p.id}
              className="mt-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 disabled:opacity-60"
            >
              {loading === p.id ? "Starting checkout…" : "Buy scan pack"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
