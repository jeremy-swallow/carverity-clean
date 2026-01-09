import { useNavigate } from "react-router-dom";
import { generateScanId } from "../utils/scanStorage";

export default function InPersonScan() {
  const navigate = useNavigate();

  function startInspection() {
    const scanId = generateScanId();
    navigate(`/scan/in-person/summary/${scanId}`);
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
        <h1
          style={{
            fontSize: "clamp(28px, 6vw, 40px)",
            marginBottom: 12,
          }}
        >
          In-person inspection
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          I’ll guide you through key checks while you’re standing next to the
          car. You can take your time — this is designed for real inspections.
        </p>
      </header>

      <button
        onClick={startInspection}
        style={{
          alignSelf: "flex-start",
          padding: "14px 22px",
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 600,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
          cursor: "pointer",
        }}
      >
        Begin inspection
      </button>

      <footer style={{ fontSize: 14, color: "#9aa3c7" }}>
        This inspection will be saved on this device.
      </footer>
    </div>
  );
}
