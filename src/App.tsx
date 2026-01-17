// src/App.tsx

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

/* Core pages */
import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import WhatToExpect from "./pages/WhatToExpect";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import SignIn from "./pages/SignIn";
import Account from "./pages/Account";
import AuthLinkExpired from "./pages/AuthLinkExpired";

/* In-person flow */
import InPersonStart from "./pages/InPersonStart";
import InPersonVehicleDetails from "./pages/InPersonVehicleDetails";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecksIntro from "./pages/InPersonChecksIntro";
import InPersonChecksAroundCar from "./pages/InPersonChecksAroundCar";
import InPersonChecksInsideCabin from "./pages/InPersonChecksInsideCabin";
import InPersonChecksDriveIntro from "./pages/InPersonChecksDriveIntro";
import InPersonChecksDrive from "./pages/InPersonChecksDrive";
import InPersonAskingPrice from "./pages/InPersonAskingPrice";
import InPersonSummary from "./pages/InPersonSummary";
import InPersonAnalyzing from "./pages/InPersonAnalyzing";
import InPersonResults from "./pages/InPersonResults";
import InPersonDecision from "./pages/InPersonDecision";
import InPersonReportPrint from "./pages/InPersonReportPrint";

/* Legacy (safe but unused) */
import InPersonResultsPreview from "./pages/InPersonResultsPreview";
import InPersonUnlock from "./pages/InPersonUnlock";
import InPersonUnlockSuccess from "./pages/InPersonUnlockSuccess";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/account" element={<Account />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />

        {/* Auth helpers */}
        <Route path="/auth/link-expired" element={<AuthLinkExpired />} />

        {/* In-person flow */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route
          path="/scan/in-person/vehicle-details"
          element={<InPersonVehicleDetails />}
        />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />

        <Route
          path="/scan/in-person/checks/intro"
          element={<InPersonChecksIntro />}
        />
        <Route
          path="/scan/in-person/checks/around"
          element={<InPersonChecksAroundCar />}
        />
        <Route
          path="/scan/in-person/checks/inside"
          element={<InPersonChecksInsideCabin />}
        />

        <Route
          path="/scan/in-person/checks/drive-intro"
          element={<InPersonChecksDriveIntro />}
        />

        <Route
          path="/scan/in-person/checks/drive"
          element={<InPersonChecksDrive />}
        />

        <Route
          path="/scan/in-person/asking-price"
          element={<InPersonAskingPrice />}
        />

        <Route path="/scan/in-person/summary" element={<InPersonSummary />} />

        <Route
          path="/scan/in-person/analyzing/:scanId"
          element={<InPersonAnalyzing />}
        />
        <Route
          path="/scan/in-person/results/:scanId"
          element={<InPersonResults />}
        />

        {/* Buyer-safe decision page */}
        <Route path="/scan/in-person/decision" element={<InPersonDecision />} />

        <Route path="/scan/in-person/print" element={<InPersonReportPrint />} />

        {/* Legacy (safe but unused) */}
        <Route
          path="/scan/in-person/preview"
          element={<InPersonResultsPreview />}
        />
        <Route
          path="/scan/in-person/unlock/:scanId"
          element={<InPersonUnlock />}
        />
        <Route
          path="/scan/in-person/unlock/success"
          element={<InPersonUnlockSuccess />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
