import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function InPersonUnlock() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlockReport() {
    if (!scanId || unlocking) return;

    setUnlocking(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/sign-in");
      return;
    }

    try {
      const res = await fetch("/api/mark-in-person-scan-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanId }),
      });

      if (!res.ok) {
        throw new Error("FAILED_TO_MARK_COMPLETED");
      }

      navigate("/scan/in-person/results");
    } catch (err) {
      console.error(err);
      setError("Something went wrong unlocking the report.");
      setUnlocking(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-xl md:text-2xl font-semibold text-white">
        Unlock full report
      </h1>

      <p className="text-slate-300 text-sm">
        Once unlocked, this inspection is final and cannot be refunded.
      </p>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/30 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={unlockReport}
        disabled={unlocking}
        className={[
          "w-full rounded-xl px-4 py-3 font-semibold shadow transition",
          unlocking
            ? "bg-emerald-500/60 text-black/70 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-400 text-black",
        ].join(" ")}
      >
        {unlocking ? "Unlocking…" : "Unlock report"}
      </button>
    </div>
  );
}
