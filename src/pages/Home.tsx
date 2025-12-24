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
        gap: 48,
      }}
    >
      {/* HERO */}
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          Buy a used car with confidence
        </h1>

        <p
          style={{
            fontSize: "18px",
            maxWidth: 720,
            color: "#cbd5f5",
          }}
        >
          CarVerity helps you analyse a car listing before you buy — highlighting
          risks, ownership factors, condition signals and potential red-flags.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
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
              const el = document.getElementById("how-it-works");
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
            Learn how it works
          </button>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ display: "grid", gap: 18 }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
          }}
        >
          How CarVerity works
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <Card
            title="1. Paste the car listing URL"
            body="Start by sharing the link to the vehicle you're considering — Carsales, Marketplace, dealer listing and more."
          />

          <Card
            title="2. Answer a few quick questions"
            body="We ask focused questions about history, condition and usage to build context around the vehicle."
          />

          <Card
            title="3. Get insights before you buy"
            body="CarVerity highlights risk factors, signals to investigate further and details shoppers often overlook."
          />
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
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

/* Simple layout card component */
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
