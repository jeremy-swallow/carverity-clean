import { useState } from "react";
import { useNavigate } from "react-router-dom";

type PhotoStep = {
  key: string;
  title: string;
  instruction: string;
  guideImage: string;
};

const STEPS: PhotoStep[] = [
  {
    key: "front",
    title: "Front of the car",
    instruction:
      "Stand a few metres back and make sure the entire front of the car is visible in the frame.",
    guideImage: "/photo-guides/front.png",
  },
  {
    key: "rear",
    title: "Rear of the car",
    instruction:
      "Take a clear photo of the full rear of the car, including the bumper and tail lights.",
    guideImage: "/photo-guides/rear.png",
  },
  {
    key: "side-left",
    title: "Left side of the car",
    instruction:
      "Capture the full left side from front to rear. Try to keep the car straight in the frame.",
    guideImage: "/photo-guides/side-left.png",
  },
  {
    key: "side-right",
    title: "Right side of the car",
    instruction:
      "Capture the full right side of the car from front to rear, similar to the previous photo.",
    guideImage: "/photo-guides/side-right.png",
  },
];

export default function InPersonPhotos() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  function handleNext() {
    if (isLast) {
      navigate("/scan/in-person/summary");
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 28,
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
          {step.title}
        </h1>

        <p
          style={{
            color: "#cbd5f5",
            lineHeight: 1.6,
            maxWidth: 560,
          }}
        >
          {step.instruction}
        </p>
      </header>

      {/* Guide image */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "16px 0",
        }}
      >
        <img
          src={step.guideImage}
          alt={step.title}
          style={{
            maxWidth: "100%",
            maxHeight: 240,
            objectFit: "contain",
            borderRadius: 12,
          }}
        />
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={handleNext}
          style={{
            padding: "14px 22px",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            background: "#7aa2ff",
            color: "#0b1020",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isLast ? "Continue" : "Next photo"}
        </button>

        <button
          onClick={() => navigate("/scan/in-person")}
          style={{
            background: "none",
            border: "none",
            color: "#9aa7d9",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}
