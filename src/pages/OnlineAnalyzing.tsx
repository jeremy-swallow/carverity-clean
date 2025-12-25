// src/pages/OnlineAnalyzing.tsx
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

    // ⭐ Build a basic placeholder report (for now)
    const generatedReport = {
      version: "v1",
      createdAt: new Date().toISOString(),
      source: "placeholder-analysis",
      summary:
        "This is a temporary sample report. The next upgrade will replace this with real AI-generated insights.",
      sections: [
        {
          title: "Listing Overview",
          content:
            "Placeholder content — listing extraction & vehicle signals will appear here.",
        },
        {
          title: "Risk Factors",
          content:
            "Placeholder content — potential concerns or red flags will appear here.",
        },
        {
          title: "Next Actions",
          content:
            "Placeholder content — recommended steps for inspection and verification.",
        },
      ],
    };

    // 💾 Save to session storage so the report page can read it
    sessionStorage.setItem(
      "active_report",
      JSON.stringify(generatedReport)
    );

    // Simulate processing delay, then open report page
    const timer = setTimeout(() => {
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
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
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
        context, kilometres and ownership signals — to prepare insights that
        help you decide whether this vehicle is worth pursuing.
      </p>

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
