// src/pages/InPersonUnlockSuccess.tsx

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";

export default function InPersonUnlockSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const scanId = params.get("scanId");

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    const progress = loadProgress();

    // Resume exactly where the user left off
    if (progress?.scanId === scanId && progress?.step) {
      navigate(progress.step, { replace: true });
      return;
    }

    // Fallback: start page if anything is missing
    navigate("/scan/in-person/start", { replace: true });
  }, [scanId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">Finalising your purchase…</p>
    </div>
  );
}
