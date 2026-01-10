// src/pages/InPersonUnlock.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";

function unlockScan(scanId: string) {
  const raw = localStorage.getItem("carverity_unlocked_scans");
  const unlocked = raw ? JSON.parse(raw) : {};
  unlocked[scanId] = true;
  localStorage.setItem(
    "carverity_unlocked_scans",
    JSON.stringify(unlocked)
  );
}

export default function InPersonUnlock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = loadProgress();
  const scanId =
    searchParams.get("scanId") ||
    progress?.scanId ||
    "";

  const isSuccessReturn =
    window.location.pathname.endsWith("/unlock/success");

  /* -------------------------------------------------------
     Safety: no scan → restart
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [scanId, navigate]);

  /* -------------------------------------------------------
     Stripe success → unlock scan
  ------------------------------------------------------- */
  useEffect(() => {
    if (!scanId || !isSuccessReturn) return;

    if (!isScanUnlocked(scanId)) {
      unlockScan(scanId);
    }

    navigate("/scan/in-person/results", { replace: true });
  }, [scanId, isSuccessReturn, navigate]);

  /* -------------------------------------------------------
     Stripe Checkout redirect
  ------------------------------------------------------- */
  async function handleUnlock() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(
          data?.error || "Unable to start secure checkout"
        );
      }

      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan — Unlock
      </span>

      <h1 className="text-2xl md:text-3xl font-semibold text-white">
        Unlock full inspection results
      </h1>

      <p className="text-sm text-slate-300 max-w-xl">
        You’ve completed the inspection. Unlocking gives you the full
        assessment, clear proceed / caution / walk-away guidance, and
        buyer-safe negotiation points — for this vehicle only.
      </p>

      <section className="rounded-2xl bg-slate-900/70 border border-white/10 px-6 py-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-white">
            What you’ll unlock
          </p>
          <ul className="mt-2 text-sm text-slate-300 space-y-1">
            <li>• Overall inspection verdict</li>
            <li>• Confidence & completeness signals</li>
            <li>• Key risks worth clarifying</li>
            <li>• Buyer-safe negotiation guidance</li>
          </ul>
        </div>

        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-slate-400">
            One-time payment • Applies only to this scan
          </p>
          <p className="text-lg font-semibold text-white mt-1">
            $14.99 AUD
          </p>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-semibold px-6 py-4"
      >
        {loading ? "Redirecting to secure checkout…" : "Unlock for $14.99"}
      </button>

      <button
        onClick={() => navigate("/scan/in-person/summary")}
        className="w-full rounded-xl border border-white/25 text-slate-200 px-6 py-3"
      >
        Back to summary
      </button>

      <p className="text-[11px] text-slate-400 text-center max-w-xl mx-auto">
        Payments are securely handled by Stripe. CarVerity never stores
        your card details.
      </p>
    </div>
  );
}
