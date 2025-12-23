import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnlineKilometres() {
  const navigate = useNavigate();
  const [km, setKm] = useState("");

  const canContinue = km.trim().length > 0;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <header>
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 40px)",
            marginBottom: 12,
          }}
        >
          About how many kilometres does it have?
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          This helps me put wear, condition, and risk into context.
          An estimate is perfectly fine.
        </p>
      </header>

      {/* INPUT CARD */}
      <div
        style={{
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <label
          htmlFor="kilometres"
          style={{ fontSize: 14, color: "#9aa3c7" }}
        >
          Approximate kilometres
        </label>

        <input
          id="kilometres"
          type="text"
          placeholder="e.g. 85,000 km"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
          }}
        />

        <button
          onClick={() => navigate("/scan/online/analyzing")}
          style={{
            alignSelf: "flex-start",
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.08)",
            color: "#cbd5f5",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          I’m not sure
        </button>
      </div>

      {/* ACTIONS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          disabled={!canContinue}
          onClick={() => navigate("/scan/online/analyzing")}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            background: canContinue ? "#7aa2ff" : "#3a3f55",
            color: canContinue ? "#0b1020" : "#9aa3c7",
            border: "none",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>

        <button
          onClick={() => navigate("/scan/online")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa3c7",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}
