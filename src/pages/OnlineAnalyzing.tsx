import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  saveScan,
  generateScanId,
} from "../utils/scanStorage";
import type { SavedScan } from "../utils/scanStorage";

const ONLINE_SAVED_FLAG = "carverity_online_saved";

export default function OnlineAnalyzing() {
  const navigate = useNavigate();

  useEffect(() => {
    const alreadySaved = localStorage.getItem(ONLINE_SAVED_FLAG);
    if (alreadySaved) {
      navigate("/scan/online/report");
      return;
    }

    const listingUrl =
      localStorage.getItem("carverity_listing_url") || "";

    const scan: SavedScan = {
      id: generateScanId(),
      type: "online",
      title: "Online listing check",
      createdAt: new Date().toISOString(),
      listingUrl,
      summary:
        "This online assessment focused on listing consistency, missing details, and areas worth verifying in person.",
    };

    saveScan(scan);
    localStorage.setItem(ONLINE_SAVED_FLAG, "true");

    const timer = setTimeout(() => {
      navigate("/scan/online/report");
    }, 1200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 6vw, 64px)",
      }}
    >
      <h1>Checking the listing…</h1>
      <p style={{ color: "#cbd5f5" }}>
        I’m reviewing the listing and preparing a summary for you.
      </p>
    </div>
  );
}
