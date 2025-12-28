// src/pages/StartScan.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function StartScan() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");

  const canContinue = link.trim().length > 10;

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/start",
      startedAt: new Date().toISOString(),
    });

    const existing = localStorage.getItem("carverity_listing_url");
    if (existing) setLink(existing);
  }, []);

  function handleContinue() {
    const trimmed = link.trim();
    localStorage.setItem("carverity_listing_url", trimmed);

    // 👉 Use the route that definitely exists
    navigate("/scan/online/vehicle-details");
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
      <span
        style={{
          fontSize: 13,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "#9aa3c7",
        }}
      >
        Online scan · Step 1 of 5
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>
        Let’s start with the listing
      </h1>

      <input
        type="url"
        placeholder="https://example.com/listing"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        style={{
          padding: 16,
          borderRadius: 12,
          fontSize: 16,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(7,10,25,0.9)",
          color: "#e5ebff",
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
          background: canContinue ? "#7aa2ff" : "#3a3f55",
          color: canContinue ? "#0b1020" : "#9aa3c7",
          border: "none",
          cursor: canContinue ? "pointer" : "default",
        }}
      >
        Continue
      </button>
    </div>
  );
}
