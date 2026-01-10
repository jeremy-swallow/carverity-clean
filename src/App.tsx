import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import WhatToExpect from "./pages/WhatToExpect";

/* =======================
   In-person scan flow
======================= */
import InPersonStart from "./pages/InPersonStart";
import InPersonVehicleDetails from "./pages/InPersonVehicleDetails";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonSummary from "./pages/InPersonSummary";
import InPersonReportPrint from "./pages/InPersonReportPrint";

/* =======================
   Other pages
======================= */
import MyScans from "./pages/MyScans";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Core */}
        <Route path="/" element={<Home />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />

        {/* IN-PERSON SCAN */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route
          path="/scan/in-person/vehicle-details"
          element={<InPersonVehicleDetails />}
        />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
        <Route path="/scan/in-person/summary" element={<InPersonSummary />} />
        <Route
          path="/scan/in-person/report-print"
          element={<InPersonReportPrint />}
        />

        {/* Library */}
        <Route path="/my-scans" element={<MyScans />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
