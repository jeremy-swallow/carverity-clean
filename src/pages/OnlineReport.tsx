import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { saveScan } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function OnlineReport() {
  const { scanId } = useParams();

  const concern =
    localStorage.getItem("carverity_primary_concern") ||
    "Peace of mind";

  const context = "online";

  const summary =
    "This online assessment highlights areas worth verifying before inspecting the car in person. It focuses on consistency, disclosure, and potential risk signals in the listing.";

  useEffect(() => {
    if (!scanId) return;

    const scan: SavedScan = {
      id: scanId,
      type: "online",
      title: "Online check",
      createdAt: new Date().toISOString(),
      concern,
      context,
      summary,
    };

    saveScan(scan);
  }, [scanId, concern]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <h1>Your online assessment</h1>

      <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
        {summary}
      </p>

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong>Primary concern</strong>
        <p style={{ color: "#cbd5f5", marginTop: 6 }}>
          {concern}
        </p>
      </section>

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Saved on this device.
      </p>
    </div>
  );
}
