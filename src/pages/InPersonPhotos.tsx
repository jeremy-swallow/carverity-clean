import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function InPersonPhotos() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mark this step in progress
    saveProgress({
      type: "in-person",
      step: "/scan/in-person/photos",
      startedAt: new Date().toISOString(),
    });
  }, []);

  function handleContinue() {
    navigate("/scan/in-person/checks");
  }

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
      {/* Step context */}
      <span
        style={{
          fontSize: 13,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "#9aa3c7",
        }}
      >
        In-person scan · Step 2 of 4
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        Let’s start by capturing a few photos
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        These photos help you spot visible issues and give you something to
        review later — instead of relying only on memory.
      </p>

      {/* Guidance box */}
      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <p style={{ color: "#e5ebff", fontSize: 14, marginBottom: 8 }}>
          Suggested angles:
        </p>

        <ul style={{ marginLeft: 18, color: "#cbd5f5", fontSize: 14 }}>
          <li>Front of the car</li>
          <li>Rear of the car</li>
          <li>Driver side & passenger side</li>
          <li>Interior — dash & centre console</li>
          <li>Engine bay (if accessible)</li>
        </ul>

        <p style={{ color: "#9aa3c7", fontSize: 13, marginTop: 10 }}>
          You can continue even if you can’t take all photos — just capture
          what’s practical.
        </p>
      </div>

      {/* Action */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleContinue}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            cursor: "pointer",
          }}
        >
          Continue to checks
        </button>
      </div>
    </div>
  );
}
