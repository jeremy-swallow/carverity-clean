import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { saveScan } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

const SCAN_SAVED_FLAG_PREFIX = "carverity_online_scan_saved_";

export default function OnlineReport() {
  const { scanId } = useParams();

  useEffect(() => {
    if (!scanId) return;

    const flagKey = `${SCAN_SAVED_FLAG_PREFIX}${scanId}`;
    const alreadySaved = localStorage.getItem(flagKey);
    if (alreadySaved) return;

    const scan: SavedScan = {
      id: scanId,
      type: "online",
      title: "Online check",
      createdAt: new Date().toISOString(),
    };

    saveScan(scan);
    localStorage.setItem(flagKey, "true");
  }, [scanId]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <h1 style={{ fontSize: 32 }}>Online scan report</h1>

      <p style={{ color: "#cbd5f5" }}>
        This report is associated with scan ID:
      </p>

      <code
        style={{
          padding: 12,
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          color: "#9aa7d9",
          width: "fit-content",
        }}
      >
        {scanId}
      </code>
    </div>
  );
}
