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

    // After purchase, we should send them back to unlock.
    // Unlock page will:
    // - refresh credits
    // - consume 1 credit via server
    // - then move into analyzing/results
    navigate(`/scan/in-person/unlock/${encodeURIComponent(scanId)}`, {
      replace: true,
    });
  }, [scanId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">Finalising your purchase…</p>
    </div>
  );
}
