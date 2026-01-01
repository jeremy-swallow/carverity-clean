// src/pages/OnlineStart.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineStart() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleaned = url.trim();

    if (!cleaned) {
      alert("Please paste a valid car listing URL before continuing.");
      return;
    }

    // ✅ Persist URL for the analyzing step
    localStorage.setItem(LISTING_URL_KEY, cleaned);

    // 🚀 Move to analyzing page
    navigate("/online/analyzing-listing");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-2">Paste the listing URL</h1>
      <p className="text-muted-foreground mb-6">
        CarVerity will scan the listing and help you review it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-slate-900"
          placeholder="https://example.com/car-listing"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded shadow w-full"
        >
          Scan listing
        </button>
      </form>
    </div>
  );
}
