// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";

import OnlineStart from "./pages/OnlineStart";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineAssist from "./pages/OnlineAssist";
import OnlineVehicleDetails from "./pages/OnlineVehicleDetails";
import OnlinePhotos from "./pages/OnlinePhotos";
import OnlineNextActions from "./pages/OnlineNextActions";
import OnlineResults from "./pages/OnlineResults";

import InPersonStart from "./pages/InPersonStart";

import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";

export default function App() {
  return (
    <Routes>
      {/* 🌐 App Shell — header, credits, navigation */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {/* Online Scan Flow */}
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/scan/online" element={<OnlineStart />} />
        <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/scan/online/assist" element={<OnlineAssist />} />
        <Route
          path="/scan/online/vehicle-details"
          element={<OnlineVehicleDetails />}
        />
        <Route path="/scan/online/photos" element={<OnlinePhotos />} />
        <Route path="/scan/online/next-actions" element={<OnlineNextActions />} />
        <Route path="/scan/online/results" element={<OnlineResults />} />

        {/* In-Person Scan Flow */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />

        {/* My Scans */}
        <Route path="/my-scans" element={<MyScans />} />

        {/* Pricing */}
        <Route path="/pricing" element={<Pricing />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
