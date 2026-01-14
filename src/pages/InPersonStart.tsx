import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { clearProgress } from "../utils/scanProgress";

export default function InPersonStart() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearProgress();
  }, []);

  async function startInspection() {
    if (loading) return;
    setLoading(true);

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
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (res.status === 402) {
      navigate("/pricing");
      return;
    }

    if (!res.ok) {
      alert("Something went wrong starting the inspection.");
      setLoading(false);
      return;
    }

    navigate("/scan/in-person/vehicle-details");
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
          One scan credit will be used when you begin.
        </p>
      </section>

      <button
        onClick={startInspection}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-4 py-3 shadow"
      >
        {loading ? "Starting…" : "Start inspection"}
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Credits are deducted securely when the inspection begins.
      </p>
    </div>
  );
}
