import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function InPersonChecks() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mark this step in the in-person scan
    saveProgress({
      type: "in-person",
      step: "/scan/in-person/checks",
      startedAt: new Date().toISOString(),
    });
  }, []);

  function handleContinue() {
    navigate("/scan/in-person/summary");
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
        In-person scan · Step 3 of 4
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        Now let’s check a few important details
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        Take a moment to look over key areas of the car. These checks help you
        spot warning signs and things that may be worth asking the seller
        about.
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
          Things to pay attention to:
        </p>

        <ul style={{ marginLeft: 18, color: "#cbd5f5", fontSize: 14 }}>
          <li>Panel alignment, dents or mismatched paint</li>
          <li>Unusual tyre wear or uneven tread</li>
          <li>Warning lights on the dash when the car is running</li>
          <li>Smoke, rattles or rough idle</li>
          <li>Strong smells inside the cabin</li>
        </ul>

        <p style={{ color: "#9aa3c7", fontSize: 13, marginTop: 10 }}>
          Only check what’s safe and practical — you don’t need tools or
          mechanical knowledge for this step.
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
          Continue to summary
        </button>
      </div>
    </div>
  );
}
