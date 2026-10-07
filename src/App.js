import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./MemberAdmin.css";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Premium from "./pages/Premium";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/AdminLogin";
import BackButton from "./components/BackButton";
import { LanguageProvider } from "./Language";

function App() {
  return (
    <LanguageProvider><BrowserRouter>
      <Routes>

        {/* Login Page */}
        <Route path="/login" element={<><div className="login-back"><BackButton fallback={null} /></div><AdminLogin /></>} />

        {/* Admin Panel */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />

      </Routes>
    </BrowserRouter></LanguageProvider>
  );
}

export default App;
