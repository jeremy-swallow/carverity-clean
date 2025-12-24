import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineOwners() {
  const navigate = useNavigate();
  const [owners, setOwners] = useState("");
  const canContinue = owners.trim().length > 0;

  useEffect(() => {
    // Track that the user reached this step
    saveProgress({
      type: "online",
      step: "/scan/online/owners",
      startedAt: new Date().toISOString(),
    });

    // Restore previously entered value if present
    const existing = localStorage.getItem("carverity_owners");
    if (existing) setOwners(existing);
  }, []);

  function handleContinue() {
    const value = owners.trim();
    localStorage.setItem("carverity_owners", value);

    navigate("/scan/online/analyzing");
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
          How many previous owners has the car had?
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Enter the number of owners listed (or your best understanding from the
          advert or seller). If you’re unsure, an estimate is fine — we’ll take
          it into account as part of the assessment.
        </p>
      </div>

      {/* Input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="owners"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Number of previous owners
        </label>

        <input
          id="owners"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 1, 2 or 3+"
          value={owners}
          onChange={(e) => setOwners(e.target.value)}
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
          Tip: Fewer owners can suggest consistent care, while many owners in a
          short time may be worth asking more questions about.
        </p>
      </div>

      {/* Actions */}
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
