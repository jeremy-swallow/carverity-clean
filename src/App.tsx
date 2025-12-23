import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Layout from "./components/Layout";
import ClarifyingQuestions from "./components/ClarifyingQuestions";

/* =========================================================
   SIMPLE PLACEHOLDER PAGE
========================================================= */
const Page = ({ title }: { title: string }) => {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 16 }}>{title}</h1>
      <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
        This page is wired correctly.
        <br />
        We’ll replace this with the real UI next.
      </p>
    </div>
  );
};

/* =========================================================
   ANALYSIS TRANSITION (PLACEHOLDER)
========================================================= */
function Analyzing() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 48px)",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 16 }}>
        Analysing the listing…
      </h1>

      <p style={{ color: "#cbd5f5", lineHeight: 1.6 }}>
        I’m reviewing the details and looking for potential risks,
        inconsistencies, or red flags.
        <br />
        This usually only takes a moment.
      </p>
    </div>
  );
}

/* =========================================================
   APP ROUTING
========================================================= */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Page title="Home" />} />
          <Route path="/start-scan" element={<Page title="Start Scan" />} />

          {/* ONLINE SCAN FLOW */}
          <Route
            path="/scan/online"
            element={<ClarifyingQuestions />}
          />
          <Route
            path="/scan/online/analyzing"
            element={<Analyzing />}
          />

          {/* OTHER ROUTES */}
          <Route path="/pricing" element={<Page title="Pricing" />} />
          <Route path="/checkout" element={<Page title="Checkout" />} />
          <Route
            path="/checkout/success"
            element={<Page title="Checkout Success" />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
