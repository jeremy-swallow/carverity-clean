// src/pages/OnlineKilometres.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineKilometres() {
  const navigate = useNavigate();
  const [kms, setKms] = useState("");
  const canContinue = kms.trim().length > 0;

  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/kilometres",
      startedAt: new Date().toISOString(),
    });

    const existing = localStorage.getItem("carverity_kilometres");
    if (existing) setKms(existing);
  }, []);

  function handleContinue() {
    const value = kms.trim();
    localStorage.setItem("carverity_kilometres", value);

    navigate("/scan/online/owners");
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
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 13,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#9aa3c7",
          }}
        >
          Online scan · Step 3 of 5
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          How many kilometres has the car done?
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Enter the odometer reading shown in the listing. If it isn’t exact,
          a close estimate is fine — we’ll still use it to help assess usage
          and wear.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="kms"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Kilometres (odometer)
        </label>

        <input
          id="kms"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 142,000"
          value={kms}
          onChange={(e) => setKms(e.target.value)}
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 16,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />

        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          Tip: Very low or very high kilometres for age may warrant extra checks.
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
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
    </div>
  );
}
