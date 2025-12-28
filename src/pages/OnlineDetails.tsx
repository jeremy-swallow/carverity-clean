import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";

export default function OnlineDetails() {
  const navigate = useNavigate();
  const progress = loadProgress();

  const [form, setForm] = useState({
    title: "",
    price: "",
    kms: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleContinue() {
    saveProgress({
      ...progress,
      type: "online",
      step: "/scan/online/analyzing",
      details: form,
    });

    navigate("/scan/online/analyzing");
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px,6vw,64px)", display: "flex", flexDirection: "column", gap: 18 }}>
      <span style={{ fontSize: 13, letterSpacing: 0.8, textTransform: "uppercase", color: "#9aa3c7" }}>
        Online scan · Step 2 of 3
      </span>

      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Add basic vehicle details</h1>

      <input
        name="title"
        placeholder="Vehicle (e.g. 2018 Mazda CX-5 Touring)"
        value={form.title}
        onChange={handleChange}
        style={{ padding: 14, borderRadius: 12 }}
      />

      <input
        name="price"
        placeholder="Price (optional)"
        value={form.price}
        onChange={handleChange}
        style={{ padding: 14, borderRadius: 12 }}
      />

      <input
        name="kms"
        placeholder="Kilometres (optional)"
        value={form.kms}
        onChange={handleChange}
        style={{ padding: 14, borderRadius: 12 }}
      />

      <textarea
        name="notes"
        placeholder="Anything you want AI to consider…"
        value={form.notes}
        onChange={handleChange}
        style={{ padding: 14, borderRadius: 12, minHeight: 120 }}
      />

      <button
        onClick={handleContinue}
        style={{
          padding: "14px 22px",
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 600,
          background: "#7aa2ff",
          color: "#0b1020",
          border: "none",
          cursor: "pointer",
        }}
      >
        Continue to AI analysis
      </button>
    </div>
  );
}
