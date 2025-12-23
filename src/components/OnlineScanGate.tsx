import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  "Reading listing details",
  "Reviewing vehicle photos",
  "Checking for inconsistencies",
  "Assessing visible condition",
  "Preparing insights",
];

export default function OnlineScanGate() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  const context =
    localStorage.getItem("carverity_scan_context") || "online";

  const concern =
    localStorage.getItem("carverity_primary_concern") ||
    "general condition";

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;

        if (next % 20 === 0 && stepIndex < STEPS.length - 1) {
          setStepIndex((i) => i + 1);
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            navigate("/scan/online/report");
          }, 800);
        }

        return next;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [navigate, stepIndex]);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 12 }}>
        Analysing the {context === "online" ? "listing" : "car"}
      </h1>

      <p style={{ color: "#cbd5f5", marginBottom: 12 }}>
        Paying extra attention to <strong>{concern.toLowerCase()}</strong>.
      </p>

      <p style={{ color: "#cbd5f5", marginBottom: 32 }}>
        {STEPS[stepIndex]}…
      </p>

      <div
        style={{
          height: 10,
          borderRadius: 6,
          background: "rgba(255,255,255,0.1)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "#7aa2ff",
            transition: "width 0.2s ease",
          }}
        />
      </div>

      <span style={{ fontSize: 14, color: "#94a3b8" }}>
        This usually takes under a minute
      </span>
    </div>
  );
}
