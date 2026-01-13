// src/pages/Pricing.tsx
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
    id: "price_1So9TcEg9XaXx1nSyeYvpaQb",
    label: "Single scan",
    price: "$14.99",
    description: "Best for a one-off check.",
  },
  {
    id: "price_1SoppbEg9XaXx1nSfp5Xex90",
    label: "3 scan pack",
    price: "$39",
    description: "Most popular.",
  },
  {
    id: "price_1SoprREg9XaXx1nSnIKEnh0U",
    label: "5 scan pack",
    price: "$59",
    description: "Best value.",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(priceId: string) {
    setLoading(priceId);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // 🔐 Not logged in → send magic link, then return here
    if (!session?.access_token) {
      await supabase.auth.signInWithOtp({
        email: prompt("Enter your email to continue") || "",
        options: {
          emailRedirectTo: `${window.location.origin}/pricing?resumeCheckout=${priceId}`,
        },
      });

      setLoading(null);
      return;
    }

    // Logged in → start Stripe checkout
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error("Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Something went wrong while starting checkout.");
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-white mb-4">
        Pricing
      </h1>

      <p className="text-slate-400 mb-10">
        Purchase scan credits to unlock full in-person inspection reports.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICES.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col"
          >
            <h3 className="text-lg font-semibold text-white">
              {p.label}
            </h3>

            <div className="text-3xl font-bold text-white mt-2">
              {p.price}
            </div>

            <p className="text-slate-400 mt-2 flex-1">
              {p.description}
            </p>

            <button
              onClick={() => startCheckout(p.id)}
              disabled={loading === p.id}
              className="mt-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold py-3"
            >
              {loading === p.id ? "Starting checkout…" : "Buy scan pack"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
