import { Link } from "react-router-dom";
import { loadProgress } from "../utils/scanProgress";

export default function OnlineDetails() {
  const progress = loadProgress();

  const listingUrl = progress?.listingUrl ?? "(no link saved)";

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
      <h1 style={{ margin: 0 }}>Listing saved — next step coming soon</h1>

      <p style={{ color: "#cbd5f5" }}>
        This screen confirms the listing URL was stored correctly.
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
        <strong>Saved listing:</strong>
        <br />
        {listingUrl}
      </div>

      <Link
        to="/start-scan"
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
