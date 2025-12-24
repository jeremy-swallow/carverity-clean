import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 72px)",
        display: "flex",
        flexDirection: "column",
        gap: 56,
      }}
    >
      {/* HERO */}
      <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          Buy a used car with confidence
        </h1>

        <p style={{ fontSize: 18, maxWidth: 760, color: "#cbd5f5" }}>
          CarVerity helps everyday Australians make smarter car-buying decisions —
          whether you’re comparing listings online or inspecting a vehicle in person
          at a dealership or private sale.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/start-scan")}
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 16,
              background: "#7aa2ff",
              color: "#0b1020",
              border: "none",
            }}
          >
            Start a scan
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("modes");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              fontWeight: 600,
              fontSize: 16,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#cbd5f5",
            }}
          >
            Explore scan options
          </button>
        </div>
      </section>

      {/* TWO MODES */}
      <section id="modes" style={{ display: "grid", gap: 18 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>
          Two ways CarVerity helps you assess a vehicle
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          <ModeCard
            title="Online listing scan"
            description="Paste the link to a car listing and CarVerity helps you evaluate price signals, ownership history clues, risk factors and listing details that deserve a closer look."
            action="Start online scan"
            onClick={() => navigate("/start-scan")}
          />

          <ModeCard
            title="In-person inspection assist"
            description="Use CarVerity while you’re standing with the car — in a yard, driveway or dealership — to guide you through visual checks, photos and details that are easy to miss."
            action="Start in-person scan"
            onClick={() => navigate('/scan/in-person')}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ display: "grid", gap: 18 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>How CarVerity works</h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <Card
            title="1. Choose your scan type"
            body="Start online from a listing link, or switch to in-person mode when you’re physically with the car."
          />

          <Card
            title="2. Answer guided questions"
            body="We ask the right questions to reveal condition clues, usage patterns and risk indicators."
          />

          <Card
            title="3. Get clearer buying confidence"
            body="Your scan highlights insights and red-flags that help you decide whether the car is worth pursuing."
          />
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={() => navigate("/start-scan")}
          style={{
            padding: "16px 24px",
            borderRadius: 14,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          Start a scan now
        </button>

        <p style={{ color: "#9aa3c7", fontSize: 14 }}>
          No account required — quick, simple and privacy-friendly.
        </p>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 40,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "#9aa3c7",
          fontSize: 14,
        }}
      >
        © {new Date().getFullYear()} CarVerity — All rights reserved.
      </footer>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <strong style={{ fontWeight: 700 }}>{title}</strong>
      <p style={{ color: "#cbd5f5" }}>{body}</p>
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
        padding: 20,
        borderRadius: 14,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.15)",
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
          marginTop: 6,
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
