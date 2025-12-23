import { useNavigate } from "react-router-dom";

export default function InPersonStart() {
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
      {/* Header */}
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
          I’ll guide you step by step while you’re standing next to the car,
          helping you notice things that are easy to miss when you’re under
          pressure.
        </p>
      </header>

      {/* What to expect */}
      <section
        style={{
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <strong style={{ fontSize: 18 }}>
          What we’ll look at
        </strong>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          <li>Exterior condition and signs of past damage</li>
          <li>Interior wear and functionality</li>
          <li>Engine bay and visible mechanical clues</li>
          <li>Details worth questioning before you commit</li>
        </ul>
      </section>

      {/* Reassurance */}
      <section
        style={{
          fontSize: 14,
          color: "#9aa7d9",
          lineHeight: 1.6,
          maxWidth: 560,
        }}
      >
        You don’t need to know what to look for.  
        If something isn’t clear or doesn’t feel right, I’ll help you slow down
        and check it properly.
      </section>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => navigate("/scan/in-person/photos")}
          style={{
            padding: "16px 26px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            cursor: "pointer",
          }}
        >
          Start inspection
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa7d9",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          I’ll do this later
        </button>
      </div>
    </div>
  );
}
