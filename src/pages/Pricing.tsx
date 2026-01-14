// src/pages/Pricing.tsx

import { useState } from "react";
import { supabase } from "../supabaseClient";

type PackKey = "single" | "three" | "five";

type PackOption = {
  key: PackKey;
  label: string;
  price: string;
  description: string;
  highlight?: boolean;
};

const PACKS: PackOption[] = [
  {
    key: "single",
    label: "Single scan",
    price: "$14.99",
    description: "Best for a one-off check.",
  },
  {
    key: "three",
    label: "3 scan pack",
    price: "$39",
    description: "Most popular.",
    highlight: true,
  },
  {
    key: "five",
    label: "5 scan pack",
    price: "$59",
    description: "Best value.",
  },
];

export default function Pricing() {
  const [loadingPack, setLoadingPack] = useState<PackKey | null>(null);

  async function startCheckout(pack: PackKey) {
    try {
      setLoadingPack(pack);

      // Always fetch LIVE session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("You must be logged in to purchase scan credits.");
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ pack }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        console.error("Checkout failed:", data);
        alert("Something went wrong while starting checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("startCheckout error:", err);
      alert("Unexpected error starting checkout.");
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-white mb-2">Pricing</h1>
      <p className="text-slate-400 mb-10">
        Buy scan credits to unlock in-person inspection reports.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {PACKS.map((pack) => (
          <div
            key={pack.key}
            className={[
              "rounded-2xl border p-6 flex flex-col",
              pack.highlight
                ? "border-emerald-500/40 bg-emerald-900/20"
                : "border-slate-800 bg-slate-900/60",
            ].join(" ")}
          >
            <h2 className="text-lg font-semibold text-white mb-1">
              {pack.label}
            </h2>
            <p className="text-slate-400 text-sm mb-4">{pack.description}</p>

            <div className="text-3xl font-bold text-white mb-6">
              {pack.price}
            </div>

            <button
              onClick={() => startCheckout(pack.key)}
              disabled={loadingPack === pack.key}
              className="mt-auto rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-4 py-3 transition"
            >
              {loadingPack === pack.key
                ? "Starting checkout..."
                : "Buy scan pack"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
