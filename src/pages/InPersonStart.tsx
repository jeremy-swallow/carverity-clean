import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function InPersonStart() {
  const navigate = useNavigate();

  useEffect(() => {
    // Mark this as the current step in the in-person flow
    saveProgress({
      type: "in-person",
      step: "/scan/in-person",
      startedAt: new Date().toISOString(),
    });
  }, []);

  function handleBegin() {
    navigate("/scan/in-person/photos");
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
        In-person scan · Step 1 of 4
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        Let’s check the car together
      </h1>

      <p style={{ color: "#cbd5f5", fontSize: 15 }}>
        Use CarVerity while you’re physically with the car — in a yard,
        driveway or dealership — and we’ll guide you through visual checks,
        photos and details that are easy to miss when inspecting a vehicle.
      </p>

      <div
        style={{
          padding: 18,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          You can stop at any time — your progress is saved automatically so
          you can continue later if needed.
        </p>
      </div>

      {/* Action */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleBegin}
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
          Start in-person scan
        </button>
      </div>
    </div>
  );
}
