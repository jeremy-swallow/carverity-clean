import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadOnlineResults, saveOnlineResults } from "../utils/onlineResults";

export default function OnlinePhotos() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>([]);
  const [listingUrl, setListingUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadOnlineResults();

    if (!stored) {
      alert("No scan in progress — please start again.");
      navigate("/start-scan", { replace: true });
      return;
    }

    setListingUrl(stored.listingUrl ?? null);
    setPhotos(stored.photos?.listing ?? []);

    // ensure photos structure exists
    saveOnlineResults({
      ...stored,
      photos: {
        listing: stored.photos?.listing ?? [],
        meta: stored.photos?.meta ?? [],
      },
      step: "/online/photos",
    });
  }, []);

  function handleContinue() {
    navigate("/online/next-actions", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Select listing photos</h1>

      {listingUrl && (
        <p className="text-sm text-muted-foreground mb-6">
          From listing:{" "}
          <a
            href={listingUrl}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {listingUrl}
          </a>
        </p>
      )}

      <div className="bg-slate-800 border border-white/10 rounded-xl p-4 mb-8">
        <p className="text-sm mb-2">
          🚗 We’ll automatically pull up to 8 relevant photos from the listing.
        </p>
        <p className="text-sm opacity-70">
          You’ll be able to confirm or replace these later.
        </p>
      </div>

      {photos.length === 0 && (
        <p className="text-muted-foreground mb-6">
          No photos extracted yet — continue to proceed.
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {photos.map((url, i) => (
            <img
              key={i}
              src={url}
              className="rounded-lg border border-white/10"
            />
          ))}
        </div>
      )}

      <button
        onClick={handleContinue}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
      >
        Continue
      </button>
    </div>
  );
}
