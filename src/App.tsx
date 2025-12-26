import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import OnlineStart from "./pages/OnlineStart";
import InPersonStart from "./pages/InPersonStart";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import CreditsHistory from "./pages/CreditsHistory";
import Account from "./pages/Account";

import Landing from "./pages/Landing";

export default function App() {
  return (
    <Routes>

      {/* Public marketing homepage */}
      <Route path="/" element={<Home />} />

      {/* Optional landing page */}
      <Route path="/landing" element={<Landing />} />

      {/* Auth / App area */}
      <Route element={<Layout />}>
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/online-start" element={<OnlineStart />} />
        <Route path="/inperson-start" element={<InPersonStart />} />

        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/credits-history" element={<CreditsHistory />} />
        <Route path="/account" element={<Account />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Home />} />

    </Routes>
  );
}
