import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

export default function OnlineDetails() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const listingUrl = progress?.listingUrl ?? "(missing link)";

  // Automatically continue to analyzing step
  useEffect(() => {
    // Update progress and advance step
    saveProgress({
      ...progress,
      type: "online",
      step: "/online-analyzing",
      listingUrl,
    });

    const timer = setTimeout(() => {
      navigate("/online-analyzing");
    }, 800);

    return () => clearTimeout(timer);
  }, [navigate, listingUrl, progress]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1 style={{ margin: 0 }}>Listing saved — preparing analysis…</h1>

      <p style={{ color: "#cbd5f5" }}>
        We’ve saved your listing and are getting ready to analyze it.
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
        <strong>Listing URL:</strong>
        <br />
        {listingUrl}
      </div>

      <div style={{ fontSize: 13, color: "#9aa7d9" }}>
        You’ll be moved to the next step automatically…
      </div>
    </div>
  );
}
