// src/pages/InPersonChecks.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";
import { generateScanId } from "../utils/scanStorage";

export default function InPersonChecks() {
  const navigate = useNavigate();

  useEffect(() => {
    const progress: any = loadProgress();

    // Ensure scanId exists for continuity (no double entry)
    const scanId = progress?.scanId ?? generateScanId();

    saveProgress({
      ...(progress ?? {}),
      type: "in-person",
      scanId,
      // Force the correct premium checks corridor entry point
      step: "/scan/in-person/checks/around",
      startedAt: progress?.startedAt ?? new Date().toISOString(),
    });

    navigate("/scan/in-person/checks/around", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <p className="text-sm text-slate-400">Loading checks…</p>
    </div>
  );
}
