import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Core pages
import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Account from "./pages/Account";
import CreditsHistory from "./pages/CreditsHistory";

// Online flow
import OnlineStart from "./pages/OnlineStart";
import OnlineScan from "./pages/OnlineScan";
import OnlineAnalyzing from "./pages/OnlineAnalyzing";
import OnlineResults from "./pages/OnlineResults";
import OnlineOwners from "./pages/OnlineOwners";
import OnlineKilometres from "./pages/OnlineKilometres";
import OnlineNextActions from "./pages/OnlineNextActions";
import OnlineReport from "./pages/OnlineReport";

// In-person flow
import InPersonStart from "./pages/InPersonStart";
import InPersonScan from "./pages/InPersonScan";
import InPersonChecks from "./pages/InPersonChecks";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonSummary from "./pages/InPersonSummary";

// Shared / misc
import ScanDetails from "./pages/ScanDetails";
import ScanMode from "./pages/ScanMode";
import AuthLinkExpired from "./pages/AuthLinkExpired";

export default function App() {
  return (
    <Routes>
      {/* All main routes live inside the Layout shell */}
      <Route element={<Layout />}>
        {/* 🔹 MAIN ENTRY — the assistant-style dashboard home (RECOMMENDED) */}
        <Route path="/" element={<Home />} />

        {/* Core nav items */}
        <Route path="/start-scan" element={<StartScan />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/account" element={<Account />} />
        <Route path="/credits-history" element={<CreditsHistory />} />

        {/* Online listing flow */}
        <Route path="/online-start" element={<OnlineStart />} />
        <Route path="/online-scan" element={<OnlineScan />} />
        <Route path="/online-analyzing" element={<OnlineAnalyzing />} />
        <Route path="/online-results" element={<OnlineResults />} />
        <Route path="/online-owners" element={<OnlineOwners />} />
        <Route path="/online-kilometres" element={<OnlineKilometres />} />
        <Route path="/online-next-actions" element={<OnlineNextActions />} />
        <Route path="/online-report" element={<OnlineReport />} />

        {/* In-person inspection flow */}
        <Route path="/inperson-start" element={<InPersonStart />} />
        <Route path="/inperson-scan" element={<InPersonScan />} />
        <Route path="/inperson-checks" element={<InPersonChecks />} />
        <Route path="/inperson-photos" element={<InPersonPhotos />} />
        <Route path="/inperson-summary" element={<InPersonSummary />} />

        {/* Shared / misc screens */}
        <Route path="/scan/:scanId" element={<ScanDetails />} />
        <Route path="/scan-mode" element={<ScanMode />} />
        <Route path="/auth/link-expired" element={<AuthLinkExpired />} />

        {/* Fallback — anything unknown goes to Home */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
