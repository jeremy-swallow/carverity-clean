import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ClarifyingQuestions() {
  const navigate = useNavigate();
  const [source, setSource] = useState<"dealer" | "private" | null>(null);

  const canContinue = source !== null;

  function handleContinue() {
    navigate("/scan/online/analyzing", {
      state: {
        source,
      },
    });
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>
        A quick question before we begin
      </h1>

      <p style={{ color: "#cbd5f5", lineHeight: 1.6, marginBottom: 32 }}>
        This helps me know what to pay closer attention to.
      </p>

      {/* Question */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => setSource("dealer")}
          style={{
            padding: 16,
            borderRadius: 12,
            background:
              source === "dealer"
                ? "rgba(122,162,255,0.2)"
                : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e5e7eb",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          🏢 Dealer listing
        </button>

        <button
          onClick={() => setSource("private")}
          style={{
            padding: 16,
            borderRadius: 12,
            background:
              source === "private"
                ? "rgba(122,162,255,0.2)"
                : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e5e7eb",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          👤 Private seller
        </button>
      </div>

      {/* Continue */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          style={{
            padding: "14px 22px",
            borderRadius: 10,
            background: canContinue ? "#7aa2ff" : "#374151",
            color: "#0b1020",
            fontWeight: 600,
            border: "none",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
