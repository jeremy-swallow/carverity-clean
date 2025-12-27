// src/App.tsx

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

/* ---------- MAIN PAGES ---------- */
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import MyScans from "./pages/MyScans";
import FAQ from "./pages/FAQ";
import Account from "./pages/Account";

/* ---------- ONLINE FLOW ---------- */
import OnlineDetails from "./pages/OnlineDetails";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineResults from "./pages/OnlineResults";
import StartScan from "./pages/StartScan";

/* ---------- IN-PERSON FLOW (active steps) ---------- */
import InPersonStart from "./pages/InPersonStart";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonOwners from "./pages/InPersonOwners";

/* ---------- UTIL PAGES ---------- */
import CreditsHistory from "./pages/CreditsHistory";
import DeployTest from "./pages/DeployTest";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Main */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />

        {/* Utilities */}
        <Route path="/credits-history" element={<CreditsHistory />} />
        <Route path="/deploy-test" element={<DeployTest />} />

        {/* Public Start Entry */}
        <Route path="/start-scan" element={<StartScan />} />

        {/* Online Scan – friendly URLs */}
        <Route path="/online-details" element={<OnlineDetails />} />
        <Route path="/online-analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online-results" element={<OnlineResults />} />

        {/* Internal developer paths for compatibility */}
        <Route path="/scan/online/start" element={<StartScan />} />
        <Route path="/scan/online/details" element={<OnlineDetails />} />
        <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/scan/online/results" element={<OnlineResults />} />

        {/* In-Person Scan (enabled steps) */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
        <Route path="/scan/in-person/owners" element={<InPersonOwners />} />
      </Route>
    </Routes>
  );
}
