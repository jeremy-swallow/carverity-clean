// src/pages/OnlineStart.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveListingUrl } from "../utils/onlineResults";

export default function OnlineStart() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    saveListingUrl(url.trim());
    console.log("🚀 Saved URL:", url);

    navigate("/scan/online/analyzing", { replace: true });
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">
        Start online scan
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          placeholder="Paste listing URL"
          className="w-full rounded bg-white/5 border border-white/10 px-3 py-2"
        />

        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500"
        >
          Start scan
        </button>
      </form>
    </div>
  );
}
