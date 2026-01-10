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
import InPersonChecksAroundCar from "./pages/InPersonChecksAroundCar";
import InPersonChecksInsideCabin from "./pages/InPersonChecksInsideCabin";
import InPersonChecksDrive from "./pages/InPersonChecksDrive";
import InPersonSummary from "./pages/InPersonSummary";
import InPersonResultsPreview from "./pages/InPersonResultsPreview";
import InPersonUnlock from "./pages/InPersonUnlock";
import InPersonResults from "./pages/InPersonResults";
import InPersonNegotiation from "./pages/InPersonNegotiation";
import InPersonReportPrint from "./pages/InPersonReportPrint";

/* =======================
   Other pages
======================= */
import MyScans from "./pages/MyScans";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

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
        <Route
          path="/scan/in-person/checks/around"
          element={<InPersonChecksAroundCar />}
        />
        <Route
          path="/scan/in-person/checks/inside"
          element={<InPersonChecksInsideCabin />}
        />
        <Route
          path="/scan/in-person/checks/drive"
          element={<InPersonChecksDrive />}
        />
        <Route path="/scan/in-person/summary" element={<InPersonSummary />} />

        {/* PREVIEW → UNLOCK → RESULTS */}
        <Route
          path="/scan/in-person/preview"
          element={<InPersonResultsPreview />}
        />
        <Route
          path="/scan/in-person/unlock"
          element={<InPersonUnlock />}
        />
        <Route path="/scan/in-person/results" element={<InPersonResults />} />
        <Route
          path="/scan/in-person/negotiation"
          element={<InPersonNegotiation />}
        />
        <Route
          path="/scan/in-person/report-print"
          element={<InPersonReportPrint />}
        />

        {/* Legal */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Library */}
        <Route path="/my-scans" element={<MyScans />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
