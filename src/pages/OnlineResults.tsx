import { Link } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";

export default function OnlineResults() {
  const progress = loadProgress();
  const listingUrl = progress?.listingUrl ?? "(missing link)";

  function finishScan() {
    // In v1 we simply clear progress
    clearProgress();
  }

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <h1 style={{ margin: 0 }}>Scan complete — results placeholder</h1>

      <p style={{ color: "#cbd5f5" }}>
        This is a temporary results screen. The listing has been processed and
        the stored URL confirms the flow worked successfully.
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
        <strong>Listing analyzed:</strong>
        <br />
        {listingUrl}
      </div>

      <p style={{ color: "#9aa7d9", fontSize: 13 }}>
        (In the next milestone, this page will show real AI analysis output.)
      </p>

      <Link
        to="/start-scan"
        onClick={finishScan}
        style={{
          fontSize: 14,
          color: "#9aa7d9",
          textDecoration: "none",
        }}
      >
        ← Back to start
      </Link>
    </div>
  );
}
