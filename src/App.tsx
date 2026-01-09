import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import WhatToExpect from "./pages/WhatToExpect";

/* =======================
   Online scan flow
======================= */
import OnlineStart from "./pages/OnlineStart";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineAssist from "./pages/OnlineAssist";
import OnlineVehicleDetails from "./pages/OnlineVehicleDetails";
import OnlinePhotos from "./pages/OnlinePhotos";
import OnlineNextActions from "./pages/OnlineNextActions";
import OnlineResults from "./pages/OnlineResults";

/* =======================
   In-person scan flow
======================= */
import InPersonStart from "./pages/InPersonStart";
import InPersonVehicleDetails from "./pages/InPersonVehicleDetails";
import InPersonAskingPrice from "./pages/InPersonAskingPrice";
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
        <Route path="/" element={<Home />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />

        {/* ONLINE SCAN */}
        <Route path="/scan/online" element={<OnlineStart />} />
        <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/scan/online/assist" element={<OnlineAssist />} />
        <Route
          path="/scan/online/vehicle-details"
          element={<OnlineVehicleDetails />}
        />
        <Route path="/scan/online/photos" element={<OnlinePhotos />} />
        <Route
          path="/scan/online/next-actions"
          element={<OnlineNextActions />}
        />
        <Route path="/scan/online/results" element={<OnlineResults />} />

        {/* IN-PERSON SCAN */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route
          path="/scan/in-person/vehicle-details"
          element={<InPersonVehicleDetails />}
        />
        <Route
          path="/scan/in-person/asking-price"
          element={<InPersonAskingPrice />}
        />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
        <Route path="/scan/in-person/summary" element={<InPersonSummary />} />
        <Route
          path="/scan/in-person/report-print"
          element={<InPersonReportPrint />}
        />

        {/* Other */}
        <Route path="/my-scans" element={<MyScans />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
