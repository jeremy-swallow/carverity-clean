import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnlineScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  const canContinue = link.trim().length > 10;

  function handleContinue() {
    localStorage.setItem(
      "carverity_listing_url",
      link.trim()
    );
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
        <h1 style={{ fontSize: 36 }}>
          Let’s start with the listing
        </h1>
        <p style={{ color: "#cbd5f5" }}>
          Paste the listing you’re looking at.
        </p>
      </header>

      <input
        type="url"
        placeholder="https://www.carsales.com.au/..."
        value={link}
        onChange={(e) => setLink(e.target.value)}
        style={{
          padding: 16,
          borderRadius: 12,
          fontSize: 16,
        }}
      />

      <button
        disabled={!canContinue}
        onClick={handleContinue}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          background: canContinue
            ? "#7aa2ff"
            : "#3a3f55",
          color: canContinue
            ? "#0b1020"
            : "#9aa3c7",
          border: "none",
          cursor: canContinue
            ? "pointer"
            : "not-allowed",
        }}
      >
        Continue
      </button>
    </div>
  );
}
