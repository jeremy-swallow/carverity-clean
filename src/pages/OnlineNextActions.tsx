import { useNavigate } from "react-router-dom";

export default function OnlineNextActions() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}
    >
      {/* Header */}
      <header>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
          What would you like to do next?
        </h1>

        <p style={{ color: "#cbd5f5", maxWidth: 720, lineHeight: 1.6 }}>
          Based on what you’ve seen so far, here are a few sensible next steps.
          There’s no pressure — this is about helping you move forward with
          confidence.
        </p>
      </header>

      {/* Actions */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {/* In-person scan */}
        <button
          onClick={() => navigate("/start-scan")}
          style={{
            padding: 22,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>
            Inspect the car in person
          </strong>
          <span style={{ color: "#cbd5f5", lineHeight: 1.5 }}>
            Use CarVerity on-site to guide your inspection and double-check the
            details that matter most.
          </span>
        </button>

        {/* Compare another car */}
        <button
          onClick={() => navigate("/scan/online")}
          style={{
            padding: 22,
            borderRadius: 16,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>
            Compare another listing
          </strong>
          <span style={{ color: "#cbd5f5", lineHeight: 1.5 }}>
            Run another online check to see how this car stacks up against other
            options you’re considering.
          </span>
        </button>

        {/* Save & revisit */}
        <button
          onClick={() => navigate("/")}
          style={{
            padding: 22,
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>
            Come back to this later
          </strong>
          <span style={{ color: "#cbd5f5", lineHeight: 1.5 }}>
            This assessment is saved on this device, so you can revisit it when
            you’re ready.
          </span>
        </button>
      </section>

      {/* Reassurance */}
      <footer style={{ color: "#9aa7d9", fontSize: 14, maxWidth: 720 }}>
        The right decision is the one that feels informed and comfortable.
        CarVerity is here to support you — not rush you.
      </footer>
    </div>
  );
}
