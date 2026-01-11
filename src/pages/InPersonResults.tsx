import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BarChart3,
  Eye,
  Handshake,
} from "lucide-react";

import { loadProgress, saveProgress } from "../utils/scanProgress";
import { isScanUnlocked } from "../utils/scanUnlock";
import { analyseInPersonInspection } from "../utils/inPersonAnalysis";

const UNLOCK_KEY_PREFIX = "carverity_inperson_unlocked_";

/* -------------------------------------------------------
   Local unlock fallback (Stripe redirect safety)
------------------------------------------------------- */
function localUnlock(scanId: string) {
  try {
    localStorage.setItem(`${UNLOCK_KEY_PREFIX}${scanId}`, "1");
  } catch {
    // ignore
  }
}

function localIsUnlocked(scanId: string) {
  try {
    return localStorage.getItem(`${UNLOCK_KEY_PREFIX}${scanId}`) === "1";
  } catch {
    return false;
  }
}

export default function InPersonResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlScanId = searchParams.get("scanId") || "";
  const sessionId = searchParams.get("session_id") || "";

  const initialProgress = loadProgress();

  /* -------------------------------------------------------
     🔑 Repair missing / mismatched scanId after Stripe
  ------------------------------------------------------- */
  useEffect(() => {
    if (urlScanId && (!initialProgress || initialProgress.scanId !== urlScanId)) {
      saveProgress({
        ...(initialProgress ?? {}),
        scanId: urlScanId,
      });
    }
  }, [urlScanId]);

  const effectiveScanId =
    urlScanId || initialProgress?.scanId || "";

  /* -------------------------------------------------------
     Safety: no scan → restart
  ------------------------------------------------------- */
  useEffect(() => {
    if (!effectiveScanId) {
      navigate("/scan/in-person/start", { replace: true });
    }
  }, [effectiveScanId, navigate]);

  /* -------------------------------------------------------
     Stripe success → mark unlocked locally + clean URL
  ------------------------------------------------------- */
  useEffect(() => {
    if (effectiveScanId && sessionId) {
      localUnlock(effectiveScanId);

      const cleanUrl = `/scan/in-person/results?scanId=${encodeURIComponent(
        effectiveScanId
      )}`;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [effectiveScanId, sessionId]);

  /* -------------------------------------------------------
     Lock enforcement
  ------------------------------------------------------- */
  const unlocked =
    (effectiveScanId ? isScanUnlocked(effectiveScanId) : false) ||
    (effectiveScanId ? localIsUnlocked(effectiveScanId) : false);

  if (!effectiveScanId) return null;

  if (!unlocked) {
    navigate("/scan/in-person/preview", { replace: true });
    return null;
  }

  /* -------------------------------------------------------
     Progress must exist before analysis
  ------------------------------------------------------- */
  const progress = loadProgress();

  if (!progress || !progress.scanId) {
    // Defensive fallback — should not happen now
    navigate("/scan/in-person/start", { replace: true });
    return null;
  }

  /* -------------------------------------------------------
     Analysis (now type-safe)
  ------------------------------------------------------- */
  const analysis = analyseInPersonInspection(progress);

  const verdictIcon =
    analysis.verdict === "proceed" ? (
      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
    ) : analysis.verdict === "caution" ? (
      <AlertTriangle className="h-6 w-6 text-amber-400" />
    ) : (
      <XCircle className="h-6 w-6 text-red-400" />
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        In-person scan
      </span>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          {verdictIcon}
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            {analysis.verdict === "proceed" &&
              "You can proceed with confidence"}
            {analysis.verdict === "caution" &&
              "Proceed carefully, with a few points to clarify"}
            {analysis.verdict === "walk-away" &&
              "This inspection raises enough concern to walk away"}
          </h1>
        </div>

        <p className="text-sm text-slate-300 max-w-xl">
          {analysis.verdictReason}
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900/60 px-6 py-5 space-y-4">
        <div className="flex items-center gap-2 text-slate-300">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium">
            Inspection signals
          </span>
        </div>

        <div className="flex gap-10">
          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Confidence
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.confidenceScore}%
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-slate-400">
              Inspection coverage
            </p>
            <p className="text-lg font-semibold text-white">
              {analysis.completenessScore}%
            </p>
          </div>
        </div>
      </section>

      {analysis.risks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Things worth understanding
            </h2>
          </div>

          {analysis.risks.map((r) => (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900/50 px-5 py-4"
            >
              <p className="text-sm text-slate-200 font-medium">
                {r.label}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {r.explanation}
              </p>
            </div>
          ))}
        </section>
      )}

      <button
        onClick={() => navigate("/scan/in-person/negotiation")}
        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-3 flex items-center justify-center gap-2"
      >
        <Handshake className="h-4 w-4" />
        View negotiation guidance
      </button>
    </div>
  );
}
