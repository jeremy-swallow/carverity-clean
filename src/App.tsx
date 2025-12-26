import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Landing from "./pages/Landing";
import Home from "./pages/Home";              // dashboard
import StartScan from "./pages/StartScan";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Account from "./pages/Account";
import CreditsHistory from "./pages/CreditsHistory";

export default function App() {
  return (
    <Routes>

      {/* ⭐ Public marketing homepage */}
      <Route path="/" element={<Landing />} />

      {/* 🚗 App dashboard + authenticated area */}
      <Route element={<Layout />}>
        <Route path="/app" element={<Home />} />
        <Route path="/app/start-scan" element={<StartScan />} />
        <Route path="/app/my-scans" element={<MyScans />} />
        <Route path="/app/pricing" element={<Pricing />} />
        <Route path="/app/faq" element={<FAQ />} />
        <Route path="/app/account" element={<Account />} />
        <Route path="/app/credits-history" element={<CreditsHistory />} />
      </Route>
    </Routes>
  );
}
