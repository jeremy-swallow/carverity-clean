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

import InPersonChecksIntro from "./pages/InPersonChecksIntro";
import InPersonChecksAroundCar from "./pages/InPersonChecksAroundCar";
import InPersonChecksInsideCabin from "./pages/InPersonChecksInsideCabin";
import InPersonChecksDrive from "./pages/InPersonChecksDrive";

import InPersonSummary from "./pages/InPersonSummary";
import InPersonResults from "./pages/InPersonResults";
import InPersonNegotiation from "./pages/InPersonNegotiation";
import InPersonReportPrint from "./pages/InPersonReportPrint";

/* =======================
   Other pages
======================= */
import MyScans from "./pages/MyScans";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />

        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route
          path="/scan/in-person/vehicle-details"
          element={<InPersonVehicleDetails />}
        />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />

        {/* SPLIT CHECKS */}
        <Route path="/scan/in-person/checks" element={<InPersonChecksIntro />} />
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
        <Route path="/scan/in-person/results" element={<InPersonResults />} />
        <Route
          path="/scan/in-person/negotiation"
          element={<InPersonNegotiation />}
        />
        <Route
          path="/scan/in-person/report-print"
          element={<InPersonReportPrint />}
        />

        <Route path="/my-scans" element={<MyScans />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
