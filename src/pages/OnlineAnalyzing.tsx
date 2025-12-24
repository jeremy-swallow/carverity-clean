import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveScan, generateScanId } from "../utils/scanStorage";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      saveScan({
        id: generateScanId(),
        type: "online",
        title: "Online listing analysis",
        createdAt: new Date().toISOString(),
      });

      navigate("/scan/online/report");
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>
        Analysing the listing
      </h1>

      <p style={{ color: "#cbd5f5" }}>
        Checking details, common issues, and market signals…
      </p>
    </div>
  );
}
