interface ResultItem {
  title: string;
  description: string;
  action?: string;
  confidence?: string;
}

export default function OnlineResults() {
  const results: ResultItem[] = [
    {
      title: "Price alignment",
      description:
        "This vehicle is priced slightly above similar listings in the same market segment.",
      action:
        "Consider negotiating the price or requesting a service history report.",
      confidence: "82%"
    },
    {
      title: "Ownership signals",
      description:
        "Listing and VIN pattern indicate the vehicle has likely had a single private owner.",
      confidence: "91%"
    },
    {
      title: "Listing consistency",
      description:
        "No major wording or detail discrepancies detected in the advertisement.",
      confidence: "88%"
    }
  ];

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24
      }}
    >
      <div>
        <span
          style={{
            fontSize: 13,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "#9aa3c7"
          }}
        >
          Online scan · Results
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
          Your preliminary analysis
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          These insights are based on the information provided so far. They help
          you decide whether this vehicle is worth continuing to inspect.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {results.map((item, index) => (
          <div
            key={index}
            style={{
              padding: 16,
              borderRadius: 14,
              background: "rgba(7,10,25,0.9)",
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 6 }}>{item.title}</h2>

            <p style={{ color: "#e5ebff", opacity: 0.9 }}>
              {item.description}
            </p>

            {item.action && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#9aa3c7"
                }}
              >
                <strong>Suggested action: </strong>
                {item.action}
              </p>
            )}

            {item.confidence && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#9aa3c7"
                }}
              >
                Confidence score: {item.confidence}
              </p>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => (window.location.href = "/online/next-actions")}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            cursor: "pointer"
          }}
        >
          Continue to next actions
        </button>
      </div>
    </div>
  );
}
