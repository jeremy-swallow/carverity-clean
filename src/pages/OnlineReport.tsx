import { useEffect } from "react";
import { clearProgress } from "../utils/scanProgress";

export default function OnlineReport() {
  // ✅ Scan is complete — clear active progress
  useEffect(() => {
    clearProgress();
  }, []);

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
      <h1>Your vehicle report</h1>

      {/* 
        Existing report UI goes here.
        This file intentionally does NOT save progress.
      */}

      <p style={{ color: "#cbd5f5" }}>
        This scan is complete. You can start a new scan at any time.
      </p>
    </div>
  );
}
