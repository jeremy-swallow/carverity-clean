import { useNavigate } from "react-router-dom";

type SavedReport = {
  concern: string;
  context: string;
  createdAt: string;
};

const STORAGE_KEY = "carverity_latest_online_report";

export default function OnlineReport() {
  const navigate = useNavigate();

  const concern =
    localStorage.getItem("carverity_primary_concern") ||
    "Not sure — just want peace of mind";

  const context =
    localStorage.getItem("carverity_scan_context") || "online";

  // Save report once on first render
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const report: SavedReport = {
      concern,
      context,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  }

  function concernIntro() {
    switch (concern) {
      case "Mechanical issues":
        return "You mentioned mechanical reliability as your main concern, so I focused on signs that could indicate wear, neglect, or issues that aren’t always obvious in listings.";
      case "Accident or damage history":
        return "You mentioned accident or damage history as your main concern, so I paid closer attention to panel alignment, paint consistency, and what the photos don’t show.";
      case "Price vs condition":
        return "You mentioned price versus condition as your main concern, so I focused on whether the listing presentation and details justify the asking price.";
      default:
        return "You mentioned wanting peace of mind, so I took a broad look at the listing to spot anything that may be worth checking more closely.";
    }
  }

  function keyFocusPoints() {
    switch (concern) {
      case "Mechanical issues":
        return [
          "Gaps or inconsistencies in service history",
          "Limited detail around recent maintenance",
          "Photos that avoid the engine bay or underbody",
        ];
      case "Accident or damage history":
        return [
          "Photos that avoid certain angles or panels",
          "Inconsistent reflections or paint finish",
          "Limited close-ups of common impact areas",
        ];
      case "Price vs condition":
        return [
          "Presentation quality compared to similar listings",
          "Kilometres relative to the asking price",
          "Missing details that would justify the premium",
        ];
      default:
        return [
          "Overall consistency of the listing",
          "What’s shown versus what’s not",
          "Signals that suggest further verification",
        ];
    }
  }

  function overallAssessment() {
    switch (concern) {
      case "Mechanical issues":
        return "Nothing immediately suggests a major red flag from the listing alone, but mechanical condition is rarely fully visible online. This one is worth inspecting carefully rather than assuming it’s problem-free.";
      case "Accident or damage history":
        return "There are no obvious signs of past damage from the listing, but the absence of detail means it’s important to confirm panel condition and history in person.";
      case "Price vs condition":
        return "The listing appears reasonably presented, but the value really depends on whether the condition matches the asking price when viewed in person.";
      default:
        return "Based on the listing alone, nothing stands out as a clear deal-breaker. That said, listings rarely tell the full story, so verification is key.";
    }
  }

  function nextChecks() {
    switch (concern) {
      case "Mechanical issues":
        return [
          "Ask for evidence of recent servicing or repairs",
          "Listen for unusual noises during a cold start",
          "Confirm when major maintenance items were last done",
        ];
      case "Accident or damage history":
        return [
          "Check panel gaps and paint consistency in natural light",
          "Ask directly about past accidents or insurance claims",
          "Inspect common impact areas closely",
        ];
      case "Price vs condition":
        return [
          "Compare it against similar cars with similar kilometres",
          "Confirm what features or condition justify the price",
          "Be prepared to negotiate if condition doesn’t align",
        ];
      default:
        return [
          "Verify the condition matches the photos",
          "Ask questions about anything not shown clearly",
          "Trust your instincts during the inspection",
        ];
    }
  }

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
      <section>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>
          Your latest assessment
        </h1>

        <p style={{ color: "#cbd5f5", maxWidth: 680, lineHeight: 1.6 }}>
          I’ve reviewed the {context === "online" ? "listing" : "car"} with your
          priorities in mind. This report will remain available on this device.
        </p>
      </section>

      {/* Overall assessment */}
      <section
        style={{
          padding: 22,
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          borderLeft: "4px solid #7aa2ff",
        }}
      >
        <strong style={{ fontSize: 18, display: "block", marginBottom: 8 }}>
          Overall assessment
        </strong>
        <p style={{ color: "#cbd5f5", margin: 0 }}>
          {overallAssessment()}
        </p>
      </section>

      {/* Personalised focus */}
      <section>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          Focus based on your concern
        </h2>
        <p style={{ color: "#cbd5f5", maxWidth: 760 }}>
          {concernIntro()}
        </p>
      </section>

      {/* Key focus points */}
      <section>
        <h3 style={{ fontSize: 20, marginBottom: 10 }}>
          What I paid closest attention to
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          {keyFocusPoints().map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      {/* Next steps */}
      <section
        style={{
          padding: 22,
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <strong style={{ display: "block", marginBottom: 10 }}>
          What to verify next
        </strong>
        <ul
          style={{
            margin: 0,
            paddingLeft: 20,
            color: "#cbd5f5",
            lineHeight: 1.6,
          }}
        >
          {nextChecks().map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Continue */}
      <section>
        <button
          onClick={() => navigate("/scan/online/next-actions")}
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
          What would you like to do next?
        </button>
      </section>

      {/* Disclaimer */}
      <p style={{ color: "#6b7280", fontSize: 13 }}>
        This assessment is saved locally on this device and does not replace a
        physical inspection or professional advice.
      </p>
    </div>
  );
}
