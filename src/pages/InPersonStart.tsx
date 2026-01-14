/* =========================================================
   In-person start
   • Single, in-person–only inspection flow
   • Atomic credit deduction before scan starts
   • Redirects to pricing if no credits
========================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

export default function InPersonStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always start fresh — no auto-resume
    clearProgress();
  }, []);

  async function startInspection() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/sign-in");
        return;
      }

      const res = await fetch("/api/start-in-person-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 402) {
        // No credits
        navigate("/pricing");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to start inspection");
      }

      // Credit successfully deducted — begin scan
      navigate("/scan/in-person/vehicle-details");
    } catch (err) {
      console.error(err);
      setError("Something went wrong starting the inspection. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <span className="text-[11px] tracking-wide uppercase text-slate-400">
        In-person inspection
      </span>

      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Start your in-person inspection
      </h1>

      <section className="rounded-2xl border border-white/12 bg-slate-900/70 px-5 py-4 space-y-3">
        <p className="text-sm text-slate-300">
          CarVerity will guide you through a calm, real-world inspection of the
          vehicle.
        </p>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>You’ll capture a few key exterior photos first</li>
          <li>Then follow guided checks as you move around the car</li>
          <li>You can note anything that feels worth confirming</li>
        </ul>

        <p className="text-[11px] text-slate-400">
          This inspection focuses on observations and confidence — not pricing
          or diagnosis.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={startInspection}
        disabled={loading}
        className="
          w-full rounded-xl bg-emerald-500 hover:bg-emerald-400
          disabled:opacity-60 disabled:cursor-not-allowed
          text-black font-semibold px-4 py-3 shadow
        "
      >
        {loading ? "Starting inspection…" : "Start inspection (uses 1 credit)"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        One scan credit will be used when the inspection begins.
      </p>
    </div>
  );
}
