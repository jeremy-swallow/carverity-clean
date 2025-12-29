/* src/components/PhotoLightbox.tsx */

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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">

      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative max-w-4xl w-full px-6">
        <img
          src={src}
          alt={`Photo ${index + 1}`}
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-xl px-3 py-1 border border-white/30 rounded-lg"
        >
          Close ✕
        </button>

        {/* Previous */}
        {index > 0 && (
          <button
            onClick={onPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 px-4 py-2 text-lg border border-white/40 rounded-lg"
          >
            ←
          </button>
        )}

        {/* Next */}
        {index < photos.length - 1 && (
          <button
            onClick={onNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 px-4 py-2 text-lg border border-white/40 rounded-lg"
          >
            →
          </button>
        )}
      </div>
    </div>
  );
}
