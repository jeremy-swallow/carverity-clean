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
import StartScan from "./pages/StartScan";
import OnlineScan from "./pages/OnlineScan";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineOwners from "./pages/OnlineOwners";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineResults from "./pages/OnlineResults";

/* ---------- IN-PERSON FLOW ---------- */
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
        {/* ---------- MAIN ---------- */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />

        {/* ---------- UTIL ---------- */}
        <Route path="/credits-history" element={<CreditsHistory />} />
        <Route path="/deploy-test" element={<DeployTest />} />

        {/* ---------- ENTRY ---------- */}
        <Route path="/start-scan" element={<StartScan />} />

        {/* =========================================================
           ONLINE SCAN — PRIMARY FLOW (user-visible)
           ========================================================= */}
        <Route path="/scan/online" element={<OnlineScan />} />
        <Route path="/scan/online/kilometres" element={<OnlineKilometres />} />
        <Route path="/scan/online/owners" element={<OnlineOwners />} />
        <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/scan/online/results" element={<OnlineResults />} />

        {/* =========================================================
           FRIENDLY ALIASES (back-compat / bookmarks)
           ========================================================= */}
        <Route path="/online" element={<OnlineScan />} />
        <Route path="/online/kilometres" element={<OnlineKilometres />} />
        <Route path="/online/owners" element={<OnlineOwners />} />
        <Route path="/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online/results" element={<OnlineResults />} />

        {/* =========================================================
           IN-PERSON FLOW
           ========================================================= */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
        <Route path="/scan/in-person/owners" element={<InPersonOwners />} />
      </Route>
    </Routes>
  );
}
