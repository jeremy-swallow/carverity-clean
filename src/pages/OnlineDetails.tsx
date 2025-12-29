import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress, saveProgress } from "../utils/scanProgress";

type ListingPhoto = {
  id: string;
  dataUrl: string;
};

const MAX_PHOTOS = 12;

export default function OnlineDetails() {
  const navigate = useNavigate();

  const [condition, setCondition] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canContinue = condition.trim().length > 0;

  useEffect(() => {
    // Track that the user reached this step
    saveProgress({
      type: "online",
      step: "/scan/online/details",
      startedAt: new Date().toISOString(),
    });

    // Restore saved values if user comes back
    const existingCondition = localStorage.getItem("carverity_condition");
    const existingNotes = localStorage.getItem("carverity_notes");

    if (existingCondition) setCondition(existingCondition);
    if (existingNotes) setNotes(existingNotes);

    const progress = loadProgress();
    if (progress) {
      if (progress.conditionSummary && !existingCondition) {
        setCondition(progress.conditionSummary);
      }
      if (progress.notes && !existingNotes) {
        setNotes(progress.notes);
      }

      const listingPhotos = progress.photos?.listing ?? [];
      if (listingPhotos.length) {
        setPhotos(
          listingPhotos.map((url, index) => ({
            id: `loaded-${index}-${Date.now()}`,
            dataUrl: url,
          }))
        );
      }
    }
  }, []);

  function handleFiles(inputFiles: FileList | File[]) {
    const currentCount = photos.length;
    if (currentCount >= MAX_PHOTOS) return;

    const filesArray = Array.from(inputFiles).filter((file) =>
      file.type.startsWith("image/")
    );

    const remainingSlots = MAX_PHOTOS - currentCount;
    const limitedFiles = filesArray.slice(0, remainingSlots);

    limitedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : "";
        if (!dataUrl) return;

        setPhotos((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length) {
      handleFiles(files);
    }
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleContinue() {
    const trimmedCondition = condition.trim();
    const trimmedNotes = notes.trim();

    localStorage.setItem("carverity_condition", trimmedCondition);
    localStorage.setItem("carverity_notes", trimmedNotes);

    const listingPhotoUrls = photos.map((p) => p.dataUrl);

    // Persist into scan progress for the analyzing step / future AI
    saveProgress({
      type: "online",
      step: "/scan/online/details",
      startedAt: new Date().toISOString(),
      conditionSummary: trimmedCondition,
      notes: trimmedNotes,
      photos: {
        listing: listingPhotoUrls,
      },
    });

    // Proceed to the analysis stage
    navigate("/scan/online/analyzing");
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
          Online scan · Listing details
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          Tell us about the car’s condition
        </h1>

        <p style={{ color: "#cbd5f5", fontSize: 15 }}>
          Add any details from the listing that may affect value or risk — such
          as service history, accident damage, modifications, or seller notes.
          You can also attach photos from the listing to help guide your report.
        </p>
      </div>

      {/* Condition summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="condition"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Overall condition (required)
        </label>

        <textarea
          id="condition"
          placeholder="e.g. Good condition, full service history, some scratches on rear bumper"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          rows={4}
          style={{
            padding: 16,
            borderRadius: 12,
            fontSize: 15,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(7,10,25,0.9)",
            color: "#e5ebff",
          }}
        />

        <p style={{ color: "#9aa3c7", fontSize: 13 }}>
          This helps AI assess risk factors and negotiation leverage.
        </p>
      </div>

      {/* Optional notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="notes"
          style={{ fontSize: 14, color: "#cbd5f5", fontWeight: 500 }}
        >
          Optional notes (seller comments, observations)
        </label>

        <textarea
          id="notes"
          placeholder="Anything else worth noting?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
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

      {/* Listing photos */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
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
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 14,
                color: "#e5ebff",
                fontWeight: 500,
              }}
            >
              Listing photos (optional)
            </span>
            <span style={{ fontSize: 13, color: "#9aa3c7" }}>
              Drag in photos from the listing, paste copied images, or upload
              from your device. Up to {MAX_PHOTOS} images.
            </span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              alignSelf: "flex-start",
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,255,0.7)",
              background: "rgba(15,23,42,0.9)",
              color: "#e5ebff",
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
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
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
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
            Drop images here, paste from the clipboard, or use “Upload photos”.
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
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  position: "relative",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid rgba(148,163,255,0.5)",
                }}
              >
                <img
                  src={photo.dataUrl}
                  alt="Listing"
                  style={{
                    width: "100%",
                    height: 80,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "rgba(15,23,42,0.8)",
                    borderRadius: 999,
                    border: "none",
                    color: "#e5ebff",
                    fontSize: 11,
                    padding: "2px 6px",
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

      {/* Actions */}
      <div style={{ marginTop: 12 }}>
        <button
          disabled={!canContinue}
          onClick={handleContinue}
          style={{
            padding: "14px 22px",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            background: canContinue ? "#7aa2ff" : "#3a3f55",
            color: canContinue ? "#0b1020" : "#9aa3c7",
            border: "none",
            cursor: canContinue ? "pointer" : "default",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
