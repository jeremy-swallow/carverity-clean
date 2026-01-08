import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

function clampPrice(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n, 0), 5_000_000);
}

export default function InPersonAskingPrice() {
  const navigate = useNavigate();
  const existing = loadProgress();

  const [priceText, setPriceText] = useState(
    existing?.askingPrice ? String(existing.askingPrice) : ""
  );

  const askingPrice = clampPrice(Number(priceText.replace(/\D/g, "")));

  useEffect(() => {
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      step: "/scan/in-person/asking-price",
      askingPrice: askingPrice || undefined,
    });
  }, [askingPrice]);

  function continueNext() {
    navigate("/scan/in-person/photos");
  }

  function skipForNow() {
    saveProgress({
      ...(existing ?? {}),
      type: "in-person",
      step: "/scan/in-person/photos",
      askingPrice: undefined,
    });
    navigate("/scan/in-person/photos");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-xl md:text-2xl font-semibold text-white">
          Asking price
        </h1>
        <p className="text-sm text-slate-400">
          What price is the dealer asking for this vehicle?
        </p>
      </header>

      <section className="space-y-3">
        <label className="text-sm font-semibold text-slate-200">
          Advertised or quoted price (AUD)
        </label>

        <input
          inputMode="numeric"
          placeholder="e.g. 24,990"
          value={priceText}
          onChange={(e) =>
            setPriceText(e.target.value.replace(/[^\d]/g, ""))
          }
          className="w-full rounded-xl bg-slate-900/70 border border-white/15 px-4 py-3 text-lg text-slate-100 focus:outline-none focus:border-emerald-400/60"
        />

        <p className="text-xs text-slate-400">
          This helps us assess whether the price is fair once the inspection is
          complete. You can skip this if you’re unsure.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <button
          onClick={continueNext}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 transition-colors"
        >
          Continue to photo inspection
        </button>

        <button
          onClick={skipForNow}
          className="w-full rounded-xl border border-white/25 text-slate-200 px-4 py-3"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
