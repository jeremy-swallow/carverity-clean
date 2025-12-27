import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StartScan() {
  const navigate = useNavigate();
  const [listingUrl, setListingUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!listingUrl.trim()) {
      console.warn("No URL entered");
      return;
    }

    navigate("/scan/online/analyzing", {
      state: { listingUrl }
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-4">
        Let’s start with the listing
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          className="w-full mb-4 p-3 rounded bg-zinc-900 border border-white/10"
          placeholder="Paste listing link"
          value={listingUrl}
          onChange={(e) => setListingUrl(e.target.value)}
        />

        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
