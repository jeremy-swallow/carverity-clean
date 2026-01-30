// src/pages/InPersonResultsSafe.tsx

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import InPersonResults from "./InPersonResults";
import { loadScanById } from "../utils/scanStorage";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";
import { buildInPersonExplanation } from "../utils/inPersonExplanation";

/**
 * SAFE WRAPPER
 * -------------
 * - Does NOT modify InPersonResults
 * - Ensures explanation text always exists (fallback)
 * - Avoids strict typing issues caused by photo shape changes (storagePath vs dataUrl)
 */
export default function InPersonResultsSafe() {
  const { scanId } = useParams<{ scanId: string }>();

  const explanationFallback = useMemo(() => {
    if (!scanId) return null;

    try {
      const saved = loadScanById(scanId);
      const progress = saved?.progressSnapshot;

      if (!progress) return null;

      // Prefer already-saved analysis if present
      const analysis =
        (saved as any)?.analysis ?? analyseInPersonInspection(progress as any);

      return buildInPersonExplanation(analysis as any);
    } catch {
      return null;
    }
  }, [scanId]);

  /**
   * Attach fallback explanation onto window scope
   * so InPersonResults can read it without modification.
   */
  if (typeof window !== "undefined") {
    (window as any).__CARVERITY_FALLBACK_EXPLANATION__ = explanationFallback;
  }

  return <InPersonResults />;
}
