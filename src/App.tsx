import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";

/* Entry */
import StartScan from "./pages/StartScan";

/* My Scans */
import MyScans from "./pages/MyScans";

/* Online flow */
import OnlineScan from "./pages/OnlineScan";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineOwners from "./pages/OnlineOwners";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineReport from "./pages/OnlineReport";

/* In-person flow */
import InPersonStart from "./pages/InPersonStart";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonSummary from "./pages/InPersonSummary";

/* Scan details */
import ScanDetails from "./pages/ScanDetails";

/* Auth fallback (NEW) */
import AuthLinkExpired from "./pages/AuthLinkExpired";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home / entry */}
          <Route path="/" element={<StartScan />} />
          <Route path="/start-scan" element={<StartScan />} />

          {/* My Scans */}
          <Route path="/my-scans" element={<MyScans />} />
          <Route path="/scan/:id" element={<ScanDetails />} />

          {/* ONLINE SCAN FLOW */}
          <Route path="/scan/online" element={<OnlineScan />} />
          <Route path="/scan/online/kilometres" element={<OnlineKilometres />} />
          <Route path="/scan/online/owners" element={<OnlineOwners />} />
          <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
          <Route path="/scan/online/report" element={<OnlineReport />} />

          {/* IN-PERSON SCAN FLOW */}
          <Route path="/scan/in-person" element={<InPersonStart />} />
          <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
          <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
          <Route path="/scan/in-person/summary" element={<InPersonSummary />} />

          {/* AUTH LINK EXPIRED (NEW) */}
          <Route path="/auth/link-expired" element={<AuthLinkExpired />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
