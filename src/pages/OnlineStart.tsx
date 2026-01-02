// src/pages/OnlineStart.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LISTING_URL_KEY = "carverity_online_listing_url";

export default function OnlineStart() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      alert("Please paste a vehicle listing URL first.");
      return;
    }

    // Save URL for analyzing step
    localStorage.setItem(LISTING_URL_KEY, url.trim());

    console.log("🚀 Stored listing URL:", url.trim());

    // Move to analyzing page
    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">Online Listing Scan</h1>
      <p className="text-muted-foreground">
        Paste a listing link and we’ll analyse risks, pricing signals and seller flags.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste vehicle listing URL…"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2"
        />

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Start scan
        </button>
      </form>
    </div>
  );
}
