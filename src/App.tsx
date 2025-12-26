// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

/* ---------- Core Pages ---------- */
import Home from "./pages/Home";
import Pricing from "./pages/Pricing";
import MyScans from "./pages/MyScans";
import CreditsHistory from "./pages/CreditsHistory";
import Account from "./pages/Account";

/* ---------- Online Scan Flow ---------- */
import OnlineStart from "./pages/OnlineStart";
import OnlineDetails from "./pages/OnlineDetails";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineResults from "./pages/OnlineResults";

/* ---------- In-Person Scan (Early Steps Only) ---------- */
import InPersonStart from "./pages/InPersonStart";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonOwners from "./pages/InPersonOwners";

/* ---------- Utility / Temporary Pages ---------- */
import DeployTest from "./pages/DeployTest";

export default function App() {
  return (
    <Routes>

      {/* Main layout wrapper */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/credits" element={<CreditsHistory />} />
        <Route path="/account" element={<Account />} />

        {/* Online scan routes */}
        <Route path="/scan/online/start" element={<OnlineStart />} />
        <Route path="/scan/online/details" element={<OnlineDetails />} />
        <Route path="/scan/online/analyzing" element={<OnlineAnalyzing />} />
        <Route path="/scan/online/results" element={<OnlineResults />} />

        {/* In-person scan early steps */}
        <Route path="/scan/in-person/start" element={<InPersonStart />} />
        <Route path="/scan/in-person/photos" element={<InPersonPhotos />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />
        <Route path="/scan/in-person/owners" element={<InPersonOwners />} />

        {/* Deployment test page */}
        <Route path="/deploy-test" element={<DeployTest />} />
      </Route>

    </Routes>
  );
}
