import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";

/* Entry */
import StartScan from "./pages/StartScan";

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home / entry */}
          <Route path="/" element={<StartScan />} />
          <Route path="/start-scan" element={<StartScan />} />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
