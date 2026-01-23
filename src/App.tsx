import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

/* Core pages */
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import StartScan from "./pages/StartScan";
import ScanMode from "./pages/ScanMode";
import WhatToExpect from "./pages/WhatToExpect";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import SignIn from "./pages/SignIn";
import Account from "./pages/Account";
import AuthCallback from "./pages/AuthCallback";
import AuthLinkExpired from "./pages/AuthLinkExpired";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeployTest from "./pages/DeployTest";

/* Admin */
import Admin from "./pages/Admin";

/* Credits */
import CreditsHistory from "./pages/CreditsHistory";

/* =======================
   In-person scan flow
======================= */
import InPersonStart from "./pages/InPersonStart";
import InPersonVehicleDetails from "./pages/InPersonVehicleDetails";
import InPersonAskingPrice from "./pages/InPersonAskingPrice";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonOwners from "./pages/InPersonOwners";
import InPersonChecksIntro from "./pages/InPersonChecksIntro";
import InPersonChecksAroundCar from "./pages/InPersonChecksAroundCar";
import InPersonChecksInsideCabin from "./pages/InPersonChecksInsideCabin";
import InPersonChecksDriveIntro from "./pages/InPersonChecksDriveIntro";
import InPersonChecksDrive from "./pages/InPersonChecksDrive";
import InPersonSummary from "./pages/InPersonSummary";
import InPersonAnalyzing from "./pages/InPersonAnalyzing";
import InPersonResults from "./pages/InPersonResults";
import InPersonUnlock from "./pages/InPersonUnlock";
import InPersonUnlockSuccess from "./pages/InPersonUnlockSuccess";
import InPersonReportPrint from "./pages/InPersonReportPrint";
import InPersonDecision from "./pages/InPersonDecision";
import InPersonPricePositioning from "./pages/InPersonPricePositioning";

/* Legacy / compatibility */
import InPersonScan from "./pages/InPersonScan";
import InPersonChecks from "./pages/InPersonChecks";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Core */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/start" element={<StartScan />} />
        <Route path="/scan-mode" element={<ScanMode />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/account" element={<Account />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/link-expired" element={<AuthLinkExpired />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/deploy-test" element={<DeployTest />} />

        {/* Credits */}
        <Route path="/credits/history" element={<CreditsHistory />} />

        {/* Admin */}
        <Route path="/admin" element={<Admin />} />

        {/* =======================
           In-person scan flow
        ======================= */}
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
        <Route path="/scan/in-person/owners" element={<InPersonOwners />} />

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

        <Route path="/scan/in-person/summary" element={<InPersonSummary />} />

        <Route
          path="/scan/in-person/analyzing/:scanId"
          element={<InPersonAnalyzing />}
        />
        <Route
          path="/scan/in-person/results/:scanId"
          element={<InPersonResults />}
        />

        {/* 🔥 FIX: unlock must include scanId */}
        <Route
          path="/scan/in-person/unlock/:scanId"
          element={<InPersonUnlock />}
        />
        <Route
          path="/scan/in-person/unlock/success"
          element={<InPersonUnlockSuccess />}
        />

        {/* Decision + price positioning */}
        <Route path="/scan/in-person/decision" element={<InPersonDecision />} />
        <Route
          path="/scan/in-person/price-positioning/:scanId"
          element={<InPersonPricePositioning />}
        />

        {/* Print */}
        <Route path="/scan/in-person/print" element={<InPersonReportPrint />} />

        {/* -----------------------
           Legacy routes (keep so old links don't break)
        ----------------------- */}
        <Route path="/scan/in-person" element={<InPersonScan />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
