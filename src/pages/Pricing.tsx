// src/pages/Pricing.tsx
import { useEffect, useState } from "react";
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
    id: "price_1SoppbE9gXaXx1nSfp5Xex90",
    label: "3 scan pack",
    price: "$39",
    description: "Most popular.",
  },
  {
    id: "price_1SoprRE9gXaXx1nSnIKEnh0W",
    label: "5 scan pack",
    price: "$59",
    description: "Best value.",
  },
];

export default function Pricing() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | null
  >(null);
  const [sessionReady, setSessionReady] = useState(false);

  // 🔐 Hydrate session properly and listen for changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
        setSessionReady(true);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function startCheckout(priceId: string) {
    if (!sessionReady) {
      // Session still loading — do nothing yet
      return;
    }

    if (!session?.access_token) {
      alert("You must be logged in to purchase scan credits.");
      return;
    }

    try {
      setLoadingPriceId(priceId);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          purchaseType: "credit_pack",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        console.error("Checkout failed:", data);
        alert("Something went wrong while starting checkout. Please try again.");
        return;
      }

      // 🚀 Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("startCheckout error:", err);
      alert("Unexpected error starting checkout.");
    } finally {
      setLoadingPriceId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-white mb-2">Pricing</h1>
      <p className="text-slate-400 mb-10">
        Buy scan credits to unlock in-person inspection reports.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {PRICES.map((option) => (
          <div
            key={option.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col"
          >
            <h2 className="text-lg font-semibold text-white mb-1">
              {option.label}
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              {option.description}
            </p>

            <div className="text-3xl font-bold text-white mb-6">
              {option.price}
            </div>

            <button
              onClick={() => startCheckout(option.id)}
              disabled={
                loadingPriceId === option.id || !sessionReady
              }
              className="mt-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 transition"
            >
              {loadingPriceId === option.id
                ? "Starting checkout..."
                : "Buy scan pack"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
