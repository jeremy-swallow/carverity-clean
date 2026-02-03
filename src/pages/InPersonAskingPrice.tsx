// src/pages/InPersonAskingPrice.tsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Info } from "lucide-react";
import { loadProgress, saveProgress } from "../utils/scanProgress";

function parseAudNumber(input: string): number | null {
  const cleaned = input.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatAud(n: number) {
  return n.toLocaleString("en-AU");
}

export default function InPersonAskingPrice() {
  const navigate = useNavigate();

  // Only used for initial UI state
  const initialProgress: any = loadProgress();

  const existing = useMemo(() => {
    const v = initialProgress?.askingPrice;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const parsed = parseAudNumber(v);
      return parsed ?? null;
    }
    return null;
  }, [initialProgress]);

  const [raw, setRaw] = useState<string>(existing ? String(existing) : "");
  const [touched, setTouched] = useState(false);

  const askingPrice = useMemo(() => parseAudNumber(raw), [raw]);

  function applyQuick(amount: number) {
    setRaw(String(amount));
    setTouched(true);
  }

  function continueNext() {
    const latest = loadProgress() ?? {};

    saveProgress({
      ...latest,
      step: "/scan/in-person/asking-price",
      askingPrice: askingPrice ?? null,
    });

    navigate("/scan/in-person/summary");
  }

  function skip() {
    const latest = loadProgress() ?? {};

    saveProgress({
      ...latest,
      step: "/scan/in-person/asking-price",
      askingPrice: null,
    });

    navigate("/scan/in-person/summary");
  }

  const showError = touched && raw.trim().length > 0 && askingPrice === null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-5 w-5 text-slate-400" />
        <h1 className="text-2xl font-semibold text-white">Asking price</h1>
      </div>

      <p className="text-sm text-slate-400">
        Enter the advertised price so we can give a buyer-safe adjustment range
        based on what you recorded. This is guidance, not a valuation.
      </p>

      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-slate-300 mt-0.5" />
          <p className="text-sm text-slate-300 leading-relaxed">
            Recommendation: if you’re serious about buying, enter the exact
            advertised price. It helps the report give a more realistic
            “fair vs high” read and a better adjustment range.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <label className="text-xs uppercase tracking-wide text-slate-500">
          Advertised asking price (AUD)
        </label>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">$</span>
          <input
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setTouched(true);
            }}
            inputMode="numeric"
            placeholder="e.g. 18,990"
            className="w-full rounded-xl bg-slate-950 border border-white/15 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        {askingPrice !== null && (
          <p className="text-xs text-slate-400">
            You entered:{" "}
            <span className="text-slate-200 font-semibold">
              ${formatAud(askingPrice)}
            </span>
          </p>
        )}

        {showError && (
          <p className="text-xs text-amber-300">
            Please enter numbers only (e.g. 18990).
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {[5000, 10000, 15000, 20000, 30000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => applyQuick(amt)}
              className="rounded-full border border-white/15 bg-slate-950 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
            >
              ${formatAud(amt)}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/scan/in-person/checks/drive")}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Back
        </button>

        <button
          type="button"
          onClick={skip}
          className="flex-1 rounded-xl border border-white/25 px-4 py-3 text-slate-200"
        >
          Skip
        </button>

        <button
          type="button"
          onClick={continueNext}
          className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-3 font-semibold text-black"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
