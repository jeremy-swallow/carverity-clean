import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Track that the user reached this step
    saveProgress({
      type: "online",
      step: "/scan/online/analyzing",
      startedAt: new Date().toISOString(),
    });

    // Simulate analysis time before moving to report
    const timer = setTimeout(() => {
      navigate("/scan/online/report");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {/* Step context */}
      <span
        style={{
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#9aa3c7",
        }}
      >
        Online scan · Step 4 of 5
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        We’re analysing your information
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        CarVerity is reviewing the details you’ve provided — including listing
        context, kilometres and ownership signals — to prepare insights that can
        help you decide whether this vehicle is worth pursuing.
      </p>

      {/* Visual loading element */}
      <div
        style={{
          marginTop: 12,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid rgba(255,255,255,0.15)",
          borderTopColor: "#7aa2ff",
          animation: "spin 1s linear infinite",
        }}
      />

      <p style={{ color: "#9aa3c7", fontSize: 13 }}>
        This usually takes a few seconds. Your report will appear next.
      </p>

      {/* Inline keyframes */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
