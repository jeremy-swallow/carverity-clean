// src/pages/Pricing.tsx

import { useState } from "react";
import { supabase } from "../supabaseClient";

type PackKey = "single" | "three" | "five";

type PackOption = {
  key: PackKey;
  title: string;
  price: string;
  context: string;
  note?: string;
  recommended?: boolean;
};

const PACKS: PackOption[] = [
  {
    key: "single",
    title: "Single inspection",
    price: "$14.99",
    context: "For a one-off vehicle you want confidence on.",
  },
  {
    key: "three",
    title: "Inspection bundle",
    price: "$39",
    context: "Ideal if you’re comparing a few vehicles.",
    note: "Most people choose this option",
    recommended: true,
  },
  {
    key: "five",
    title: "Extended bundle",
    price: "$59",
    context: "Best value if you’re actively shopping.",
  },
];

export default function Pricing() {
  const [loadingPack, setLoadingPack] = useState<PackKey | null>(null);

  async function startCheckout(pack: PackKey) {
    try {
      setLoadingPack(pack);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("Please sign in to continue.");
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
        alert("Unable to start checkout. Please try again.");
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
    <div className="max-w-5xl mx-auto px-4 py-20">
      {/* Header */}
      <header className="max-w-2xl mb-16">
        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Straightforward pricing
        </h1>
        <p className="text-slate-400 text-base">
          Each inspection gives you a calm, structured assessment you can trust
          when viewing a vehicle in person.
        </p>
      </header>

      {/* Pricing */}
      <div className="grid gap-8 md:grid-cols-3">
        {PACKS.map((pack) => (
          <div
            key={pack.key}
            className={[
              "relative rounded-2xl border px-6 py-8 flex flex-col",
              pack.recommended
                ? "border-emerald-500/40 bg-emerald-900/20"
                : "border-slate-800 bg-slate-900/60",
            ].join(" ")}
          >
            {pack.recommended && (
              <div className="absolute -top-3 left-6 text-xs tracking-wide uppercase text-emerald-400">
                Recommended
              </div>
            )}

            <h2 className="text-lg font-semibold text-white mb-1">
              {pack.title}
            </h2>

            <p className="text-sm text-slate-400 mb-6">{pack.context}</p>

            <div className="text-3xl font-semibold text-white mb-2">
              {pack.price}
            </div>

            {pack.note && (
              <p className="text-xs text-slate-400 mb-6">{pack.note}</p>
            )}

            <button
              onClick={() => startCheckout(pack.key)}
              disabled={loadingPack === pack.key}
              className={[
                "mt-auto rounded-xl px-4 py-3 font-semibold transition",
                pack.recommended
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200",
                loadingPack === pack.key
                  ? "opacity-60 cursor-not-allowed"
                  : "",
              ].join(" ")}
            >
              {loadingPack === pack.key
                ? "Preparing checkout…"
                : "Continue"}
            </button>
          </div>
        ))}
      </div>

      {/* Footer reassurance */}
      <p className="mt-16 text-sm text-slate-500 max-w-2xl">
        Credits never expire. You only use a credit when you unlock a completed
        inspection report.
      </p>
    </div>
  );
}
