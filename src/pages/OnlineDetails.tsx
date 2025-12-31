// src/pages/OnlineDetails.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type ListingPhoto = {
  id: string;
  dataUrl: string;
};

const MAX_PHOTOS = 8;
const MAX_IMAGE_SIZE = 1600;
const JPEG_QUALITY = 0.8;

export default function OnlineDetails() {
  const navigate = useNavigate();

  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* =========================================================
     RESTORE PROGRESS (upgrade-safe)
  ========================================================= */
  useEffect(() => {
    saveProgress({
      type: "online",
      step: "/scan/online/details",
      startedAt: new Date().toISOString(),
    });

    const progress = loadProgress();

    if (typeof progress?.conditionSummary === "string")
      setCondition(progress.conditionSummary);

    if (typeof progress?.notes === "string")
      setNotes(progress.notes);

    const listingPhotos = Array.isArray(progress?.photos?.listing)
      ? progress.photos.listing
      : [];

    if (listingPhotos.length) {
      setPhotos(
        listingPhotos.map((url, i) => ({
          id: `loaded-${i}-${Date.now()}`,
          dataUrl: url,
        }))
      );
    }
  }, []);

  /* =========================================================
     IMAGE PROCESSING + SAFETY GUARDS
  ========================================================= */
  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (!src) return resolve("");
        img.src = src;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const w = img.width;
        const h = img.height;

        if (!w || !h) return resolve("");

        const scale = Math.min(MAX_IMAGE_SIZE / w, MAX_IMAGE_SIZE / h, 1);

        const newW = Math.round(w * scale);
        const newH = Math.round(h * scale);

        canvas.width = newW;
        canvas.height = newH;
        ctx?.drawImage(img, 0, 0, newW, newH);

        const compressed = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(compressed || "");
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(inputFiles: FileList | File[]) {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const images = Array.from(inputFiles).filter(
      (f) => f.type?.startsWith("image/")
    );

    const limited = images.slice(0, remaining);

    for (const file of limited) {
      const resized = await resizeImage(file);
      if (!resized) continue;

      setPhotos((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          dataUrl: resized,
        },
      ]);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const files: File[] = [];
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) handleFiles(files);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  /* =========================================================
     CONTINUE → Persist Progress + Hand Off to Analyzer
  ========================================================= */
  function handleContinue() {
    saveProgress({
      type: "online",
      step: "/scan/online/details",
      startedAt: new Date().toISOString(),

      conditionSummary: condition.trim(),
      notes: notes.trim(),

      // Normalised shape — always include meta array
      photos: {
        listing: photos.map((p) => p.dataUrl),
        meta: [],
      },
    });

    navigate("/scan/online/analyzing");
  }

  /* =========================================================
     UI
  ========================================================= */
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
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontSize: 13,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: "#9aa3c7",
          }}
        >
          Online scan · Listing details
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Tell us about the car’s condition
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Add condition details and (optionally) upload photos from the
          listing. Photos are automatically compressed. You can continue even
          if you don’t add any photos.
        </p>
      </div>

      {/* Condition */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ color: "#cbd5f5", fontWeight: 500 }}>
          Condition summary (optional)
        </label>

        <textarea
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          rows={4}
          placeholder="e.g. Good condition, service history, minor scratches"
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />
      </div>

      {/* Notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label style={{ color: "#cbd5f5", fontWeight: 500 }}>
          Optional notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything else worth noting?"
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />
      </div>

      {/* Photos */}
      <div
        style={{
          borderRadius: 16,
          border: "1px dashed rgba(148,163,255,0.6)",
          background: "rgba(15,23,42,0.8)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <span style={{ color: "#e5ebff", fontWeight: 500 }}>
              Listing photos (optional)
            </span>
            <div style={{ fontSize: 13, color: "#9aa3c7" }}>
              Up to {MAX_PHOTOS} photos. Large images are compressed.
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,255,0.7)",
              background: "rgba(15,23,42,0.9)",
              color: "#e5ebff",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Upload photos
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {photos.length === 0 ? (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 12,
              border: "1px dashed rgba(148,163,255,0.35)",
              fontSize: 13,
              color: "#9aa3c7",
              textAlign: "center",
            }}
          >
            Drag images here, paste, or upload from your device.
          </div>
        ) : (
          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
              gap: 8,
            }}
          >
            {photos.map((p) => (
              <div
                key={p.id}
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(148,163,255,0.5)",
                }}
              >
                <img
                  src={p.dataUrl}
                  alt="Listing"
                  style={{ width: "100%", height: 80, objectFit: "cover" }}
                />

                <button
                  onClick={() => removePhoto(p.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    border: "none",
                    borderRadius: 999,
                    padding: "2px 6px",
                    background: "rgba(15,23,42,0.85)",
                    color: "#e5ebff",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
      </div>
    </div>
  );
}
