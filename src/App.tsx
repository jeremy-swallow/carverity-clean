import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";

// Entry / shared
import StartScan from "./pages/StartScan";

// Online scan flow
import OnlineScan from "./pages/OnlineScan";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineOwners from "./pages/OnlineOwners";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineReport from "./pages/OnlineReport";
import OnlineNextActions from "./pages/OnlineNextActions";

// In-person scan flow
import InPersonStart from "./pages/InPersonStart";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonSummary from "./pages/InPersonSummary";

const Page = ({ title }: { title: string }) => (
  <div>
    <h1 style={{ fontSize: 36, marginBottom: 16 }}>{title}</h1>
    <p style={{ color: "#cbd5f5" }}>
      This is where the real UI will appear.
    </p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Home */}
          <Route path="/" element={<Page title="Home" />} />

          {/* Start */}
          <Route path="/start-scan" element={<StartScan />} />

          {/* Online scan flow */}
          <Route path="/scan/online" element={<OnlineScan />} />
          <Route
            path="/scan/online/kilometres"
            element={<OnlineKilometres />}
          />
          <Route
            path="/scan/online/owners"
            element={<OnlineOwners />}
          />
          <Route
            path="/scan/online/analyzing"
            element={<OnlineAnalyzing />}
          />
          <Route
            path="/scan/online/report"
            element={<OnlineReport />}
          />
          <Route
            path="/scan/online/next-actions"
            element={<OnlineNextActions />}
          />

          {/* In-person scan */}
          <Route
            path="/scan/in-person"
            element={<InPersonStart />}
          />
          <Route
            path="/scan/in-person/photos"
            element={<InPersonPhotos />}
          />
          <Route
            path="/scan/in-person/checks"
            element={<InPersonChecks />}
          />
          <Route
            path="/scan/in-person/summary"
            element={<InPersonSummary />}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
