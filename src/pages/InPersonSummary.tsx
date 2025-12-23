import { useNavigate } from "react-router-dom";

export default function InPersonSummary() {
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
          Here’s how it’s looking
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          You’ve taken the time to look over the car properly. That alone puts
          you in a much stronger position than most buyers.
        </p>
      </header>

      {/* Overall guidance */}
      <section
        style={{
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          borderLeft: "4px solid #7aa2ff",
        }}
      >
        <strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>
          What this means
        </strong>

        <p style={{ color: "#cbd5f5", margin: 0 }}>
          Nothing you’ve checked so far automatically rules this car out.
          That doesn’t mean it’s perfect — it means you’re asking the right
          questions and noticing the right details.
        </p>
      </section>

      {/* Guidance */}
      <section>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          How to use what you’ve noticed
        </h2>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          <li>
            If something felt off, ask about it directly — hesitation is a valid
            signal.
          </li>
          <li>
            If everything seemed consistent, that’s a good sign, but not a
            guarantee.
          </li>
          <li>
            Use what you saw to guide the next step, not to rush a decision.
          </li>
        </ul>
      </section>

      {/* Next actions */}
      <section
        style={{
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 10 }}>
          Sensible next steps
        </strong>

        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          <li>Request service records or maintenance history</li>
          <li>Consider a professional inspection if you’re unsure</li>
          <li>Take time to compare with another option if needed</li>
        </ul>
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
          onClick={() => navigate("/")}
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
          Finish inspection
        </button>

        <button
          onClick={() => navigate("/scan/online")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa7d9",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Compare with another car
        </button>
      </div>

      {/* Reassurance */}
      <p style={{ color: "#9aa7d9", fontSize: 14, maxWidth: 600 }}>
        The goal isn’t to find a perfect car — it’s to make a decision you feel
        comfortable with.
      </p>
    </div>
  );
}
