// src/App.tsx

import { useEffect, useState, type ReactNode } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { supabase } from "./supabaseClient";

/* Core pages */
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import StartScan from "./pages/StartScan";
import ScanMode from "./pages/ScanMode";
import WhatToExpect from "./pages/WhatToExpect";
import About from "./pages/About";
import MyScans from "./pages/MyScans";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import SignIn from "./pages/SignIn";
import Account from "./pages/Account";
import AuthCallback from "./pages/AuthCallback";
import AuthLinkExpired from "./pages/AuthLinkExpired";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeployTest from "./pages/DeployTest";

/* Tester */
import TestingExpectations from "./pages/TestingExpectations";

/* Admin */
import Admin from "./pages/Admin";

/* Credits */
import CreditsHistory from "./pages/CreditsHistory";

/* =======================
   In-person scan flow
======================= */
import InPersonStart from "./pages/InPersonStart";
import InPersonSaleContext from "./pages/InPersonSaleContext";
import InPersonVehicleDetails from "./pages/InPersonVehicleDetails";
import InPersonAskingPrice from "./pages/InPersonAskingPrice";
import InPersonPhotos from "./pages/InPersonPhotos";
import InPersonOwners from "./pages/InPersonOwners";
import InPersonChecksIntro from "./pages/InPersonChecksIntro";
import InPersonChecksAroundCar from "./pages/InPersonChecksAroundCar";
import InPersonChecksInsideCabin from "./pages/InPersonChecksInsideCabin";
import InPersonChecksDriveIntro from "./pages/InPersonChecksDriveIntro";
import InPersonChecksDrive from "./pages/InPersonChecksDrive";
import InPersonSummary from "./pages/InPersonSummary";
import InPersonAnalyzing from "./pages/InPersonAnalyzing";
import InPersonUnlock from "./pages/InPersonUnlock";
import InPersonUnlockSuccess from "./pages/InPersonUnlockSuccess";
import InPersonReportPrint from "./pages/InPersonReportPrint";
import InPersonDecision from "./pages/InPersonDecision";
import InPersonPricePositioning from "./pages/InPersonPricePositioning";

/* ✅ RESULTS (WRAPPED) */
import InPersonResultsWrapped from "./pages/InPersonResultsWrapped";

/* Legacy / compatibility */
import InPersonScan from "./pages/InPersonScan";
import InPersonChecks from "./pages/InPersonChecks";

/* =======================================================
   Protected route wrapper
======================================================= */
function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setHasSession(Boolean(data?.session));
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-sm text-slate-400">Checking sign-in…</p>
      </div>
    );
  }

  if (!hasSession) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}

/* =======================================================
   App
======================================================= */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Core */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/start" element={<StartScan />} />
        <Route path="/scan-mode" element={<ScanMode />} />
        <Route path="/what-to-expect" element={<WhatToExpect />} />
        <Route path="/about" element={<About />} />
        <Route path="/my-scans" element={<MyScans />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/account" element={<Account />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/link-expired" element={<AuthLinkExpired />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/deploy-test" element={<DeployTest />} />

        {/* Tester */}
        <Route
          path="/testing"
          element={
            <RequireAuth>
              <TestingExpectations />
            </RequireAuth>
          }
        />

        {/* Credits */}
        <Route
          path="/credits/history"
          element={
            <RequireAuth>
              <CreditsHistory />
            </RequireAuth>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <Admin />
            </RequireAuth>
          }
        />

        {/* In-person scan flow */}
        <Route
          path="/scan/in-person/start"
          element={
            <RequireAuth>
              <InPersonStart />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/sale"
          element={
            <RequireAuth>
              <InPersonSaleContext />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/vehicle-details"
          element={
            <RequireAuth>
              <InPersonVehicleDetails />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/asking-price"
          element={
            <RequireAuth>
              <InPersonAskingPrice />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/photos"
          element={
            <RequireAuth>
              <InPersonPhotos />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/owners"
          element={
            <RequireAuth>
              <InPersonOwners />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/checks/intro"
          element={
            <RequireAuth>
              <InPersonChecksIntro />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/checks/around"
          element={
            <RequireAuth>
              <InPersonChecksAroundCar />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/checks/inside"
          element={
            <RequireAuth>
              <InPersonChecksInsideCabin />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/checks/drive-intro"
          element={
            <RequireAuth>
              <InPersonChecksDriveIntro />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/checks/drive"
          element={
            <RequireAuth>
              <InPersonChecksDrive />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/summary"
          element={
            <RequireAuth>
              <InPersonSummary />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/analyzing/:scanId"
          element={
            <RequireAuth>
              <InPersonAnalyzing />
            </RequireAuth>
          }
        />

        {/* ✅ RESULTS — WRAPPED */}
        <Route
          path="/scan/in-person/results/:scanId"
          element={
            <RequireAuth>
              <InPersonResultsWrapped />
            </RequireAuth>
          }
        />

        {/* Unlock */}
        <Route
          path="/scan/in-person/unlock/:scanId"
          element={
            <RequireAuth>
              <InPersonUnlock />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/unlock/success"
          element={
            <RequireAuth>
              <InPersonUnlockSuccess />
            </RequireAuth>
          }
        />

        {/* Decision */}
        <Route
          path="/scan/in-person/decision/:scanId"
          element={
            <RequireAuth>
              <InPersonDecision />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/decision"
          element={<Navigate to="/my-scans" replace />}
        />

        {/* Price positioning */}
        <Route
          path="/scan/in-person/price-positioning/:scanId"
          element={
            <RequireAuth>
              <InPersonPricePositioning />
            </RequireAuth>
          }
        />

        {/* Print */}
        <Route
          path="/scan/in-person/print/:scanId"
          element={
            <RequireAuth>
              <InPersonReportPrint />
            </RequireAuth>
          }
        />

        <Route
          path="/scan/in-person/print"
          element={<Navigate to="/" replace />} />

        {/* Legacy */}
        <Route path="/scan/in-person" element={<InPersonScan />} />
        <Route path="/scan/in-person/checks" element={<InPersonChecks />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
