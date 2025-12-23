import { useNavigate } from "react-router-dom";

export default function StartScan() {
  const navigate = useNavigate();

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
          Let’s check the car together
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          I’ll help you choose the best way to assess this car, depending on
          whether you’re browsing online or standing next to it.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {/* ONLINE */}
        <button
          onClick={() => navigate("/scan/online")}
          style={{
            textAlign: "left",
            padding: 24,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            cursor: "pointer",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>Online listing</h3>
          <p style={{ color: "#cbd5f5", fontSize: 14 }}>
            Best if you’re researching a car on Carsales, Facebook Marketplace,
            or a dealer website.
          </p>
        </button>

        {/* IN PERSON */}
        <button
          onClick={() => navigate("/scan/in-person")}
          style={{
            textAlign: "left",
            padding: 24,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            cursor: "pointer",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>In-person inspection</h3>
          <p style={{ color: "#cbd5f5", fontSize: 14 }}>
            Best if you’re physically with the car and want guided checks.
          </p>
        </button>
      </section>

      <footer style={{ fontSize: 14, color: "#9aa3c7" }}>
        No sign-up required yet. We’ll guide you step by step.
      </footer>
    </div>
  );
}
