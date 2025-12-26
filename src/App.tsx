import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Account from "./pages/Account";
import CreditsHistory from "./pages/CreditsHistory";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/my-scans" element={<MyScans />} />

        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />
        <Route path="/credits-history" element={<CreditsHistory />} />
      </Routes>
    </Layout>
  );
}
