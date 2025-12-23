import { useState } from "react";
import { useNavigate } from "react-router-dom";

type CheckItem = {
  id: string;
  label: string;
  hint: string;
};

const CHECKS: CheckItem[] = [
  {
    id: "panel_gaps",
    label: "Panel gaps look even",
    hint: "Check doors, bonnet, and boot for uneven spacing.",
  },
  {
    id: "paint_consistency",
    label: "Paint finish looks consistent",
    hint: "Look for colour differences or odd reflections.",
  },
  {
    id: "tyres_even",
    label: "Tyres appear evenly worn",
    hint: "Uneven wear can point to alignment or suspension issues.",
  },
  {
    id: "warning_lights",
    label: "No warning lights visible on the dash",
    hint: "Ask the seller to turn the car on if needed.",
  },
  {
    id: "unusual_smells",
    label: "No unusual smells",
    hint: "Strong fuel, oil, or burning smells are worth questioning.",
  },
  {
    id: "gut_feel",
    label: "Nothing feels obviously off",
    hint: "If something doesn’t feel right, trust that instinct.",
  },
];

export default function InPersonChecks() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setChecked((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(20px, 5vw, 48px)",
        display: "flex",
        flexDirection: "column",
        gap: 32,
      }}
    >
      {/* Header */}
      <header>
        <h1
          style={{
            fontSize: "clamp(26px, 6vw, 36px)",
            marginBottom: 10,
          }}
        >
          Quick visual check
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          Take a moment to check these basics while you’re next to the car.
          You don’t need to tick everything — this is about slowing down and
          noticing anything worth asking about.
        </p>
      </header>

      {/* Checklist */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {CHECKS.map((item) => {
          const isChecked = !!checked[item.id];

          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              style={{
                padding: 18,
                borderRadius: 14,
                background: isChecked
                  ? "rgba(122,162,255,0.15)"
                  : "rgba(255,255,255,0.04)",
                border: isChecked
                  ? "1px solid rgba(122,162,255,0.6)"
                  : "1px solid rgba(255,255,255,0.08)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: 16,
                  marginBottom: 6,
                  color: isChecked ? "#e0e7ff" : "#ffffff",
                }}
              >
                {item.label}
              </strong>

              <span style={{ color: "#cbd5f5", fontSize: 14 }}>
                {item.hint}
              </span>
            </button>
          );
        })}
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
          onClick={() => navigate("/scan/in-person/summary")}
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
          Continue
        </button>

        <button
          onClick={() => navigate("/scan/in-person/photos")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa7d9",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Back to photos
        </button>
      </div>
    </div>
  );
}
