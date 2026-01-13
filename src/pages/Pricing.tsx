// src/pages/Pricing.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  signInWithMagicLink,
  handleMagicLinkCallback,
} from "../supabaseAuth";

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
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);

  /* =========================================================
     Auth bootstrap + magic link callback
  ========================================================= */
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. Try to complete magic-link callback (safe if not present)
      const callbackUser = await handleMagicLinkCallback();

      if (callbackUser && mounted) {
        setUser(callbackUser);

        // Resume checkout if user was mid-purchase
        const storedPriceId =
          localStorage.getItem("pending_price_id");
        if (storedPriceId) {
          localStorage.removeItem("pending_price_id");
          startCheckout(storedPriceId);
        }
        return;
      }

      // 2. Otherwise, load existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setUser(session?.user ?? null);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     Checkout start
  ========================================================= */
  async function startCheckout(priceId: string) {
    try {
      setLoadingPriceId(priceId);

      // Require login
      if (!user) {
        localStorage.setItem("pending_price_id", priceId);
        setPendingPriceId(priceId);
        return;
      }

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        throw new Error("Checkout failed");
      }

      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      alert(
        "Something went wrong while starting checkout. Please try again."
      );
    } finally {
      setLoadingPriceId(null);
    }
  }

  /* =========================================================
     Email login
  ========================================================= */
  async function sendMagicLink() {
    if (!email) return;

    try {
      await signInWithMagicLink(
        email,
        `${window.location.origin}/pricing`
      );
      setEmailSent(true);
    } catch {
      alert("Failed to send login email. Please try again.");
    }
  }

  /* =========================================================
     Render
  ========================================================= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-white mb-2">
        Pricing
      </h1>

      <p className="text-slate-400 mb-10">
        Buy scan credits to unlock in-person inspection reports.
      </p>

      {/* LOGIN PROMPT */}
      {!user && pendingPriceId && (
        <div className="mb-10 max-w-md bg-slate-900/60 border border-slate-700 rounded-xl p-6">
          {!emailSent ? (
            <>
              <p className="text-sm text-slate-300 mb-3">
                Enter your email to continue
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mb-3 px-3 py-2 rounded bg-slate-800 text-white border border-slate-600"
              />
              <button
                onClick={sendMagicLink}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded"
              >
                Send magic link
              </button>
            </>
          ) : (
            <p className="text-slate-300 text-sm">
              Check your email to continue. You can close this tab.
            </p>
          )}
        </div>
      )}

      {/* PRICING CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        {PRICES.map((p) => (
          <div
            key={p.id}
            className="border border-slate-800 rounded-xl p-6 bg-slate-900/40"
          >
            <h3 className="text-lg font-semibold text-white mb-1">
              {p.label}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {p.description}
            </p>
            <p className="text-3xl font-bold text-white mb-6">
              {p.price}
            </p>
            <button
              onClick={() => startCheckout(p.id)}
              disabled={loadingPriceId === p.id}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-black font-semibold py-2 rounded"
            >
              {loadingPriceId === p.id
                ? "Starting checkout…"
                : "Buy scan pack"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
