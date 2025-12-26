import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// PAGE IMPORTS — these match your /src/pages folder
import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import MyScans from "./pages/MyScans";
import OnlineScan from "./pages/OnlineScan";
import OnlineResults from "./pages/OnlineResults";
import OnlineStart from "./pages/OnlineStart";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineOwners from "./pages/OnlineOwners";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineNextActions from "./pages/OnlineNextActions";
import OnlineReport from "./pages/OnlineReport";

import InPersonStart from "./pages/InPersonStart";
import InPersonScan from "./pages/InPersonScan";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonSummary from "./pages/InPersonSummary";

import ScanDetails from "./pages/ScanDetails";
import ScanMode from "./pages/ScanMode";
import AuthLinkExpired from "./pages/AuthLinkExpired";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* GENERAL */}
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/scan-mode" element={<ScanMode />} />
        <Route path="/scan/:id" element={<ScanDetails />} />

        {/* ONLINE FLOW */}
        <Route path="/online/start" element={<OnlineStart />} />
        <Route path="/online/scan" element={<OnlineScan />} />
        <Route path="/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online/owners" element={<OnlineOwners />} />
        <Route path="/online/kilometres" element={<OnlineKilometres />} />
        <Route path="/online/next-actions" element={<OnlineNextActions />} />
        <Route path="/online/report" element={<OnlineReport />} />
        <Route path="/online/results" element={<OnlineResults />} />

        {/* IN-PERSON FLOW */}
        <Route path="/inperson/start" element={<InPersonStart />} />
        <Route path="/inperson/scan" element={<InPersonScan />} />
        <Route path="/inperson/checks" element={<InPersonChecks />} />
        <Route path="/inperson/photos" element={<InPersonPhotos />} />
        <Route path="/inperson/summary" element={<InPersonSummary />} />

        {/* AUTH / MISC */}
        <Route path="/auth/link-expired" element={<AuthLinkExpired />} />
      </Routes>
    </Layout>
  );
}
