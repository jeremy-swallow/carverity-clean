import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const listingUrl = progress?.listingUrl ?? "(missing link)";

  // Simulated analysis → move to results step later
  useEffect(() => {
    saveProgress({
      ...progress,
      type: "online",
      step: "/online-results",
      listingUrl,
    });

    const timer = setTimeout(() => {
      navigate("/online-results");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, progress, listingUrl]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <h1 style={{ margin: 0 }}>Analyzing listing…</h1>

      <p style={{ color: "#cbd5f5" }}>
        I’m reviewing the listing and looking for pricing signals, keywords,
        risks, and seller patterns.
      </p>

      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontSize: 14,
          color: "#9aa7d9",
        }}
      >
        <strong>Source:</strong>
        <br />
        {listingUrl}
      </div>

      <div style={{ color: "#9aa7d9", fontSize: 13 }}>
        This only takes a moment…
      </div>
    </div>
  );
}
