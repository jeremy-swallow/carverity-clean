import { useEffect, useRef, useState } from "react";

interface Props {
  photos: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const src = photos[index];

  const dragRef = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);

  // Config
  const SWIPE_TRIGGER = 80;     // distance required to trigger navigation
  const INERTIA_MULTIPLIER = 0.25;

  function beginDrag(e: TouchEvent | PointerEvent) {
    dragging.current = true;
    startX.current =
      "touches" in e ? e.touches[0].clientX : (e as PointerEvent).clientX;
  }

  function moveDrag(e: TouchEvent | PointerEvent) {
    if (!dragging.current) return;

    currentX.current =
      "touches" in e ? e.touches[0].clientX : (e as PointerEvent).clientX;

    const delta = currentX.current - startX.current;
    setOffset(delta);
  }

  function endDrag() {
    if (!dragging.current) return;

    dragging.current = false;

    const delta = currentX.current - startX.current;
    const inertia = delta * INERTIA_MULTIPLIER;
    const final = delta + inertia;

    // Edge-protection: only change photos if intent is strong enough
    if (final > SWIPE_TRIGGER) {
      onPrev();
    } else if (final < -SWIPE_TRIGGER) {
      onNext();
    }

    // Snap back to center
    setOffset(0);
  }

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    el.addEventListener("pointerdown", beginDrag);
    el.addEventListener("pointermove", moveDrag);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("touchstart", beginDrag, { passive: true });
    el.addEventListener("touchmove", moveDrag, { passive: true });
    el.addEventListener("touchend", endDrag);

    return () => {
      el.removeEventListener("pointerdown", beginDrag);
      el.removeEventListener("pointermove", moveDrag);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("touchstart", beginDrag);
      el.removeEventListener("touchmove", moveDrag);
      el.removeEventListener("touchend", endDrag);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* Backdrop click closes */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Image container */}
      <div
        ref={dragRef}
        className="relative max-w-5xl w-full px-6 select-none"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? "none" : "transform .25s ease-out",
        }}
      >
        <img
          src={src}
          className="w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Prev button */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 px-3 py-2 rounded-lg text-white text-lg"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          ‹
        </button>

        {/* Next button */}
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 px-3 py-2 rounded-lg text-white text-lg"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          ›
        </button>

        {/* Close button */}
        <button
          className="absolute top-2 right-2 bg-black/70 px-3 py-2 rounded-lg text-white text-sm"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
