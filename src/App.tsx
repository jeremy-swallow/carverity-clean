import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import OnlineStart from "./pages/OnlineStart";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineAnalyzingListing from "./pages/OnlineAnalyzingListing";
import OnlineVehicleDetails from "./pages/OnlineVehicleDetails";
import OnlinePhotos from "./pages/OnlinePhotos";
import OnlineNextActions from "./pages/OnlineNextActions";
import OnlineResults from "./pages/OnlineResults";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";

export default function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* Scan Flow */}
      <Route path="/start-scan" element={<StartScan />} />
      <Route path="/scan/online" element={<OnlineStart />} />
      <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />

      {/* 🔁 Compatibility route (old path still works) */}
      <Route path="/online/analyzing-listing" element={<OnlineAnalyzingListing />} />

      {/* Online Scan Steps */}
      <Route path="/online/vehicle-details" element={<OnlineVehicleDetails />} />
      <Route path="/online/photos" element={<OnlinePhotos />} />
      <Route path="/online/next-actions" element={<OnlineNextActions />} />
      <Route path="/online/results" element={<OnlineResults />} />

      {/* Other */}
      <Route path="/my-scans" element={<MyScans />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Fallback → send user home instead of blank screen */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
