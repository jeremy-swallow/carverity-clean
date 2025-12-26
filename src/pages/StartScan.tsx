import { useNavigate } from "react-router-dom";
import { loadProgress, clearProgress } from "../utils/scanProgress";
import { useOneCredit } from "../utils/scanCredits";

export default function StartScan() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const isActiveScan =
    progress &&
    progress.step &&
    progress.type &&
    progress.step.startsWith("/scan/");

  function resumeScan() {
    if (!isActiveScan) return;
    navigate(progress.step);
  }

  function startFresh() {
    const result = useOneCredit();

    if (!result.ok) {
      alert("You have no scan credits remaining.\nBuy more credits to continue.");
      navigate("/pricing");
      return;
    }

    clearProgress();
    navigate("/scan/online");
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
      <h1>Let’s check the car together</h1>

      {isActiveScan && (
        <div
          style={{
            padding: 20,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <strong>Resume your last scan?</strong>
          <p style={{ color: "#cbd5f5", marginTop: 6 }}>
            You were part-way through a{" "}
            {progress.type === "online" ? "online" : "in-person"} scan.
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              onClick={resumeScan}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "#7aa2ff",
                color: "#0b1020",
                border: "none",
                fontWeight: 600,
              }}
            >
              Resume
            </button>

            <button
              onClick={startFresh}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "transparent",
                color: "#9aa3c7",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Start new
            </button>
          </div>
        </div>
      )}

      {!isActiveScan && (
        <button
          onClick={startFresh}
          style={{
            padding: "14px 22px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
          }}
        >
          Start a scan
        </button>
      )}
    </div>
  );
}
