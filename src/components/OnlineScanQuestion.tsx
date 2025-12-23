import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Step = "context" | "concern";

export default function OnlineScanQuestion() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("context");
  const [context, setContext] = useState<"online" | "in_person" | null>(null);
  const [concern, setConcern] = useState<string | null>(null);

  function continueFromContext(value: "online" | "in_person") {
    setContext(value);
    localStorage.setItem("carverity_scan_context", value);
    setStep("concern");
  }

  function continueFromConcern(value: string) {
    setConcern(value);
    localStorage.setItem("carverity_primary_concern", value);
    navigate("/scan/online/analyse");
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
      }}
    >
      {step === "context" && (
        <>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>
            Let’s check the car together
          </h1>

          <p
            style={{
              color: "#cbd5f5",
              maxWidth: 640,
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            This helps me tailor the checks and guidance for your situation.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              onClick={() => continueFromContext("online")}
              style={buttonStyle(context === "online")}
            >
              <strong>🔍 I’m viewing an online listing</strong>
              <div style={subTextStyle}>
                Carsales, Facebook Marketplace, dealer website, etc.
              </div>
            </button>

            <button
              onClick={() => continueFromContext("in_person")}
              style={buttonStyle(context === "in_person")}
            >
              <strong>🚗 I’m standing next to the car</strong>
              <div style={subTextStyle}>
                I want guided checks while inspecting it in person.
              </div>
            </button>
          </div>
        </>
      )}

      {step === "concern" && (
        <>
          <h1 style={{ fontSize: 36, marginBottom: 12 }}>
            What’s your biggest concern?
          </h1>

          <p
            style={{
              color: "#cbd5f5",
              maxWidth: 640,
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            This helps me focus on what matters most to you.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Mechanical issues",
              "Accident or damage history",
              "Price vs condition",
              "Not sure — just want peace of mind",
            ].map((option) => (
              <button
                key={option}
                onClick={() => continueFromConcern(option)}
                style={buttonStyle(concern === option)}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const buttonStyle = (active: boolean) => ({
  padding: 18,
  borderRadius: 12,
  textAlign: "left" as const,
  background: active
    ? "rgba(122,162,255,0.15)"
    : "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#e5e7eb",
  cursor: "pointer",
});

const subTextStyle = {
  fontSize: 14,
  color: "#cbd5f5",
  marginTop: 6,
};
