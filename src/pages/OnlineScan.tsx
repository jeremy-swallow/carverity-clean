import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnlineScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  const canContinue = link.trim().length > 10;

  function handleContinue() {
    sessionStorage.setItem("carverity_listing_url", link.trim());
    navigate("/scan/online/kilometres");
  }

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
        <h1 style={{ fontSize: "clamp(28px, 6vw, 40px)", marginBottom: 12 }}>
          Let’s start with the listing
        </h1>

        <p style={{ color: "#cbd5f5", lineHeight: 1.6, maxWidth: 560 }}>
          Share the online listing you’re looking at and I’ll help you spot
          potential issues before you inspect the car in person.
        </p>
      </header>

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
        <label style={{ fontSize: 14, color: "#9aa3c7" }}>
          Paste listing link
        </label>

        <input
          type="url"
          placeholder="https://www.carsales.com.au/..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            fontSize: 16,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <button
          disabled={!canContinue}
          onClick={handleContinue}
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
          onClick={() => navigate("/start-scan")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa3c7",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Choose a different scan type
        </button>
      </div>
    </div>
  );
}
