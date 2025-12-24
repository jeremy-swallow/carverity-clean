import { useNavigate } from "react-router-dom";

export default function ScanMode() {
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
      <h1 style={{ fontSize: "28px", fontWeight: 800 }}>
        How would you like to start your scan?
      </h1>

      <p style={{ color: "#cbd5f5" }}>
        Choose the option that best matches your situation. You can switch
        between modes later if needed.
      </p>

      <div style={{ display: "grid", gap: 16 }}>
        <ModeCard
          title="Online listing scan"
          description="Paste the link to a car listing and CarVerity will help you assess key details, risk signals and things worth questioning — before you travel to see the car."
          action="Start online scan"
          onClick={() => navigate("/scan/online")}
        />

        <ModeCard
          title="In-person inspection assist"
          description="Use CarVerity while you’re with the car — in a driveway, yard or dealership — to guide you through important visual checks, photos and details that are easy to miss."
          action="Start in-person scan"
          onClick={() => navigate("/scan/in-person")}
        />
      </div>
    </div>
  );
}

function ModeCard({
  title,
  description,
  action,
  onClick,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <strong style={{ fontSize: 18 }}>{title}</strong>
      <p style={{ color: "#cbd5f5" }}>{description}</p>

      <button
        onClick={onClick}
        style={{
          marginTop: 4,
          padding: "12px 18px",
          borderRadius: 12,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
          fontWeight: 700,
        }}
      >
        {action}
      </button>
    </div>
  );
}
