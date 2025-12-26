import { Routes, Route, BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import StartScan from "./pages/StartScan";
import MyScans from "./pages/MyScans";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start-scan" element={<StartScan />} />
          <Route path="/my-scans" element={<MyScans />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
