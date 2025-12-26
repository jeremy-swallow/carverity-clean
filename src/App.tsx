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

import InPersonStart from "./pages/InPersonStart";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonOwners from "./pages/InPersonOwners";
// Temporarily unused pages (coming later)
// import InPersonKilometres from "./pages/InPersonKilometres";
// import InPersonResults from "./pages/InPersonResults";

import CreditsHistory from "./pages/CreditsHistory";
import DeployTest from "./pages/DeployTest";

export default function App() {
  return (
    <Routes>

      {/* Pages inside main layout (header + nav) */}
      <Route element={<Layout />}>

        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />

        {/* Scan flows */}
        <Route path="/start-scan" element={<StartScan />} />

        {/* Online scan flow */}
        <Route path="/online-start" element={<OnlineStart />} />
        <Route path="/online-details" element={<OnlineDetails />} />
        <Route path="/online-analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online-results" element={<OnlineResults />} />

        {/* In-person scan flow */}
        <Route path="/inperson-start" element={<InPersonStart />} />
        <Route path="/inperson-photos" element={<InPersonPhotos />} />
        <Route path="/inperson-checks" element={<InPersonChecks />} />
        <Route path="/inperson-owners" element={<InPersonOwners />} />

        {/* Credits */}
        <Route path="/credits-history" element={<CreditsHistory />} />

        {/* 🔎 Deployment verification page */}
        <Route path="/deploy-test" element={<DeployTest />} />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
