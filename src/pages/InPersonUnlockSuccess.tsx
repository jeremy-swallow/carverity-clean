// src/pages/InPersonUnlockSuccess.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function InPersonUnlockSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const scanId = params.get("scanId");

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    // No preview flow. No local unlock flag.
    // Unlocking must happen via the server endpoint that consumes credits.
    navigate(`/scan/in-person/results/${scanId}`, { replace: true });
  }, [scanId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">Opening your report…</p>
    </div>
  );
}
