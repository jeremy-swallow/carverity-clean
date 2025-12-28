/* src/pages/OnlineVehicleDetails.tsx */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProgress, loadProgress } from "../utils/scanProgress";
import {
  saveVehicleDetails,
  loadVehicleDetails,
  type VehicleDetails,
} from "../utils/vehicleDetails";

export default function OnlineVehicleDetails() {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleDetails>({
    make: "",
    model: "",
    year: "",
    variant: "",
    isImport: false,
  });

  const canContinue = !!vehicle.make || !!vehicle.model || !!vehicle.year;

  useEffect(() => {
    // Mark step reached
    saveProgress({
      type: "online",
      step: "/scan/online/vehicle-details",
      startedAt: new Date().toISOString(),
    });

    // Restore previous values if user comes back
    const existing = loadVehicleDetails();
    if (existing) {
      setVehicle({
        make: existing.make ?? "",
        model: existing.model ?? "",
        year: existing.year ?? "",
        variant: existing.variant ?? "",
        isImport: existing.isImport ?? false,
      });
    }
  }, []);

  function update<K extends keyof VehicleDetails>(key: K, value: VehicleDetails[K]) {
    setVehicle((v) => ({ ...v, [key]: value }));
  }

  function handleContinue() {
    saveVehicleDetails(vehicle);

    // Also attach to scan progress so AI can use it later
    const progress = loadProgress() ?? {};
    saveProgress({
      ...progress,
      vehicle,
    });

    navigate("/online-analyzing");
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Step context */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 13,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#9aa3c7",
          }}
        >
          Online scan · Vehicle details
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Tell us a bit about the car
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          These details help improve your AI guidance. Everything here is
          optional — fill in what you know.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: "grid", gap: 14 }}>
        <Field
          label="Make"
          placeholder="e.g. Toyota"
          value={vehicle.make ?? ""}
          onChange={(v) => update("make", v)}
        />

        <Field
          label="Model"
          placeholder="e.g. Corolla"
          value={vehicle.model ?? ""}
          onChange={(v) => update("model", v)}
        />

        <Field
          label="Year"
          placeholder="e.g. 2016"
          value={vehicle.year ?? ""}
          onChange={(v) => update("year", v)}
        />

        <Field
          label="Variant (optional)"
          placeholder="e.g. ZR / Sport / Premium"
          value={vehicle.variant ?? ""}
          onChange={(v) => update("variant", v)}
        />

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            color: "#cbd5f5",
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={vehicle.isImport ?? false}
            onChange={(e) => update("isImport", e.target.checked)}
          />
          This vehicle appears to be an import
        </label>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12 }}>
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
          Continue
        </button>

        {!canContinue && (
          <p style={{ marginTop: 10, color: "#9aa3c7", fontSize: 13 }}>
            You can continue even if you only know part of the details.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}>
        {label}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: 14,
          borderRadius: 12,
          fontSize: 15,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(7,10,25,0.9)",
          color: "#e5ebff",
        }}
      />
    </div>
  );
}
