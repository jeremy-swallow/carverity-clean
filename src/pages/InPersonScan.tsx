/* =========================================================
   In-person start
   • Requires auth
   • Atomically deducts 1 credit via API
   • Prevents double start
========================================================= */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearProgress } from "../utils/scanProgress";
import { supabase } from "../supabaseClient";

export default function InPersonStart() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clearProgress();
  }, []);

  async function startInspection() {
    if (starting) return;

    setStarting(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/signin");
      return;
    }

    try {
      const res = await fetch("/api/start-in-person-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "INSUFFICIENT_CREDITS") {
          navigate("/pricing");
          return;
        }

        throw new Error(data?.error || "START_FAILED");
      }

      navigate("/scan/in-person/vehicle-details");
    } catch (err) {
      console.error("Start inspection failed:", err);
      setError(
        "Something went wrong starting the inspection. Please try again."
      );
      setStarting(false);
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
        <p className="text-sm text-slate-300 leading-relaxed">
          CarVerity guides you through a real-world inspection so you can spot
          risk, capture evidence, and make a confident decision.
        </p>

        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          <li>Capture a few key exterior photos first</li>
          <li>Follow guided checks as you move around the vehicle</li>
          <li>Mark anything that feels unclear or worth confirming</li>
          <li>
            If you’re serious about buying the car, a short test drive is
            strongly recommended
          </li>
        </ul>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          This inspection focuses on buyer-observed evidence and decision
          confidence — not mechanical diagnosis or pricing.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={startInspection}
        disabled={starting}
        className={[
          "w-full rounded-xl px-4 py-3 font-semibold shadow transition",
          starting
            ? "bg-emerald-500/60 text-black/70 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {starting ? "Starting inspection…" : "Start inspection (uses 1 credit)"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        One scan credit will be used when the inspection begins.
      </p>
    </div>
  );
}
