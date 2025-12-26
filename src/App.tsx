import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import MyScans from "./pages/MyScans";
import FAQ from "./pages/FAQ";
import Account from "./pages/Account";

import StartScan from "./pages/StartScan";
import OnlineStart from "./pages/OnlineStart";
import OnlineDetails from "./pages/OnlineDetails";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineResults from "./pages/OnlineResults";

// --- In-person flow (WIP — disabled until pages are ready) ---
// import InPersonStart from "./pages/InPersonStart";
// import InPersonPhotos from "./pages/InPersonPhotos";
// import InPersonChecks from "./pages/InPersonChecks";
// import InPersonOwners from "./pages/InPersonOwners";
// import InPersonKilometres from "./pages/InPersonKilometres";
// import InPersonResults from "./pages/InPersonResults";

import CreditsHistory from "./pages/CreditsHistory";

export default function App() {
  return (
    <Routes>
      {/* Main layout pages */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />
        <Route path="/credits-history" element={<CreditsHistory />} />
      </Route>

      {/* Scan entry */}
      <Route path="/start-scan" element={<StartScan />} />

      {/* Online scan flow */}
      <Route path="/scan/online" element={<OnlineStart />} />
      <Route path="/scan/online/details" element={<OnlineDetails />} />
      <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
      <Route path="/scan/online/results" element={<OnlineResults />} />

      {/* In-person flow will be re-enabled later */}
    </Routes>
  );
}
