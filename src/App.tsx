import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";
import StartScan from "./pages/StartScan";
import OnlineScan from "./pages/OnlineScan";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineReport from "./pages/OnlineReport";
import InPersonSummary from "./pages/InPersonSummary";
import MyScans from "./pages/MyScans";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<StartScan />} />

          {/* Scan entry */}
          <Route path="/start-scan" element={<StartScan />} />

          {/* Online scan */}
          <Route path="/scan/online" element={<OnlineScan />} />
          <Route
            path="/scan/online/kilometres"
            element={<OnlineKilometres />}
          />
          <Route
            path="/scan/online/analyzing"
            element={<OnlineAnalyzing />}
          />
          <Route
            path="/scan/online/report"
            element={<OnlineReport />}
          />

          {/* In-person scan */}
          <Route
            path="/scan/in-person/summary"
            element={<InPersonSummary />}
          />

          {/* Saved scans */}
          <Route path="/my-scans" element={<MyScans />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
