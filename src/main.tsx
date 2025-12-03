import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { InstrumentationProvider, register } from "./instrumentation";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";

// Register instrumentation
register();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InstrumentationProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </InstrumentationProvider>
  </StrictMode>,
);