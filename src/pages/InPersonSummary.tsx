import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getScanById } from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

export default function InPersonSummary() {
  const { scanId } = useParams();
  const [scan, setScan] = useState<SavedScan | null>(null);

  useEffect(() => {
    if (!scanId) return;
    const found = getScanById(scanId);
    if (found) setScan(found);
  }, [scanId]);

  if (!scan) {
    return (
      <div style={{ padding: 40 }}>
        <p>Scan not found.</p>
      </div>
    );
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
      <h1>{scan.title}</h1>

      {scan.summary && (
        <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
          {scan.summary}
        </p>
      )}

      <p style={{ fontSize: 13, color: "#6b7280" }}>
        Saved on this device.
      </p>
    </div>
  );
}
