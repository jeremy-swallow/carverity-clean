import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  saveScan,
  getScanById,
} from "../utils/scanStorage";
import { generateAIScanInsight } from "../utils/aiInsight";
import type { SavedScan } from "../utils/scanStorage";

export default function OnlineReport() {
  const { scanId } = useParams();

  const concern =
    localStorage.getItem("carverity_primary_concern") ||
    "Peace of mind";

  useEffect(() => {
    if (!scanId) return;

    const existing = getScanById(scanId);
    if (existing?.aiInsight) return;

    const aiInsight = generateAIScanInsight(
      "online",
      concern
    );

    const scan: SavedScan = {
      id: scanId,
      type: "online",
      title: "Online check",
      createdAt: new Date().toISOString(),
      concern,
      context: "online",
      aiInsight,
    };

    saveScan(scan);
  }, [scanId, concern]);

  if (!scanId) return null;

  const scan = getScanById(scanId);

  if (!scan?.aiInsight) {
    return <div style={{ padding: 40 }}>Preparing insights…</div>;
  }

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
      <h1>Your assessment</h1>

      <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
        {scan.aiInsight.summary}
      </p>

      <section
        style={{
          padding: 20,
          borderRadius: 14,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <strong>Key things to verify</strong>
        <ul
          style={{
            marginTop: 10,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          {scan.aiInsight.focusPoints.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Confidence level: {scan.aiInsight.confidence}
      </p>
    </div>
  );
}
