import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import OnlineStart from "./pages/OnlineStart";
import OnlineDetails from "./pages/OnlineDetails";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
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
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/online-start" element={<OnlineStart />} />
        <Route path="/online-details" element={<OnlineDetails />} />
        <Route path="/online-analyzing" element={<OnlineAnalyzing />} />
        <Route path="/inperson-start" element={<InPersonStart />} />

        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/credits-history" element={<CreditsHistory />} />
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="/landing" element={<Landing />} />

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
