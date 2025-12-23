import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analyzing() {
  const location = useLocation();
  const navigate = useNavigate();
  const source = location.state?.source as "dealer" | "private" | undefined;

  const [progress, setProgress] = useState(0);

  let focusText = "I’m reviewing the listing carefully.";

  if (source === "dealer") {
    focusText =
      "Since this is a dealer listing, I’m paying close attention to pricing signals, presentation patterns, and anything that looks overly polished or selectively shown.";
  }

  if (source === "private") {
    focusText =
      "Since this is a private sale, I’m paying closer attention to inconsistencies, missing details, and signs the seller may not be fully aware of the car’s condition.";
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Temporary destination — report page later
          setTimeout(() => {
            navigate("/scan/online/report");
          }, 600);
          return 100;
        }
        return prev + 8;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>
        Analysing the listing
      </h1>

      <p
        style={{
          color: "#cbd5f5",
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        {focusText}
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: 10,
          width: "100%",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "#7aa2ff",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p style={{ color: "#9ca3af", fontSize: 14 }}>
        {progress < 100
          ? `Checking details… ${progress}%`
          : "Almost ready"}
      </p>
    </div>
  );
}
