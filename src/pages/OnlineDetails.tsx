import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress } from "../utils/scanProgress";

export default function OnlineDetails() {
  const navigate = useNavigate();

  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");

  const canContinue = condition.trim().length > 0;

  useEffect(() => {
    // Track that the user reached this step
    saveProgress({
      type: "online",
      step: "/scan/online/details",
      startedAt: new Date().toISOString(),
    });

    // Restore saved values if user comes back
    const existingCondition = localStorage.getItem("carverity_condition");
    const existingNotes = localStorage.getItem("carverity_notes");

    if (existingCondition) setCondition(existingCondition);
    if (existingNotes) setNotes(existingNotes);
  }, []);

  function handleContinue() {
    localStorage.setItem("carverity_condition", condition.trim());
    localStorage.setItem("carverity_notes", notes.trim());

    // Proceed to the analysis stage
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
          Online scan · Step 4 of 5
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Tell us about the car’s condition
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Add any details from the listing that may affect value or risk — such
          as service history, accident damage, modifications, or seller notes.
        </p>
      </div>

      {/* Condition summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="condition"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Overall condition (required)
        </label>

        <textarea
          id="condition"
          placeholder="e.g. Good condition, full service history, some scratches on rear bumper"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          rows={4}
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />

        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          This helps AI assess risk factors and negotiation leverage.
        </p>
      </div>

      {/* Optional notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="notes"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Optional notes (seller comments, observations)
        </label>

        <textarea
          id="notes"
          placeholder="Anything else worth noting?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />
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
