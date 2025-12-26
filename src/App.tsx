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

// In-person flow — enable later when pages exist
// import InPersonStart from "./pages/InPersonStart";
// import InPersonPhotos from "./pages/InPersonPhotos";
// import InPersonChecks from "./pages/InPersonChecks";
// import InPersonOwners from "./pages/InPersonOwners";
// import InPersonKilometres from "./pages/InPersonKilometres";
// import InPersonResults from "./pages/InPersonResults";

import CreditsHistory from "./pages/CreditsHistory";

// Temporary test page removed (no file right now)
// import DeployTest from "./pages/DeployTest";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />

        {/* Entry */}
        <Route path="/start-scan" element={<StartScan />} />

        {/* Online scan flow */}
        <Route path="/online-start" element={<OnlineStart />} />
        <Route path="/online-details" element={<OnlineDetails />} />
        <Route path="/online-analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online-results" element={<OnlineResults />} />

        {/* In-person flow (coming later) */}
        {/*
        <Route path="/in-person/start" element={<InPersonStart />} />
        <Route path="/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/in-person/checks" element={<InPersonChecks />} />
        <Route path="/in-person/owners" element={<InPersonOwners />} />
        <Route path="/in-person/kilometres" element={<InPersonKilometres />} />
        <Route path="/in-person/results" element={<InPersonResults />} />
        */}

        <Route path="/credits-history" element={<CreditsHistory />} />

        {/* <Route path="/deploy-test" element={<DeployTest />} /> */}

      </Route>
    </Routes>
  );
}
