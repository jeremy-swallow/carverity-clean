import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";

export default function StartScan() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(loadProgress());

  // ✅ Validate progress on mount
  useEffect(() => {
    if (!progress) return;

    const listing = localStorage.getItem("carverity_listing_url");

    // ❌ If there is progress but no listing URL, treat it as stale
    const missingListing = !listing || listing.trim().length === 0;

    // ❌ If the progress is older than 24h, also treat as stale
    const isStale =
      Date.now() - new Date(progress.updatedAt).getTime() > 24 * 60 * 60 * 1000;

    if (missingListing || isStale) {
      clearProgress();
      setProgress(null);
    }
  }, []);

  function resumeScan() {
    if (!progress) return;

    if (!progress.step.startsWith("/")) {
      clearProgress();
      navigate("/scan/online");
      return;
    }

    navigate(progress.step);
  }

  function startFresh() {
    clearProgress();
    navigate("/scan/online");
  }

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
      <h1>Let’s check the car together</h1>

      {progress && (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <strong>Resume your last scan?</strong>
          <p style={{ color: "#cbd5f5", marginTop: 6 }}>
            You were part-way through a{" "}
            {progress.type === "online" ? "online" : "in-person"} scan.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              onClick={resumeScan}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "#7aa2ff",
                color: "#0b1020",
                border: "none",
                fontWeight: 600,
              }}
            >
              Resume
            </button>

            <button
              onClick={startFresh}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "transparent",
                color: "#9aa3c7",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Start new
            </button>
          </div>
        </div>
      )}

      {!progress && (
        <button
          onClick={startFresh}
          style={{
            padding: "14px 22px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
          }}
        >
          Start a scan
        </button>
      )}
    </div>
  );
}
