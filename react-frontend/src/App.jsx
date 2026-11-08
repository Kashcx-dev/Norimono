import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "./components/AuthPortal";
import Dashboard from "./components/Dashboard/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import AlertModal from "./components/Dashboard/AlertModal";
import AIAssistant from "./components/Dashboard/AIAssistant";
import TermsModal from "./components/Dashboard/TermsModal";
import "./App.css";

// Instant Smart Root Redirect with subtle modern loader
function SmartRootRedirect() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate("/admin", { replace: true });
          return;
        } else {
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (e) {}
    }
    navigate("/auth", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white select-none">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.4)] border border-yellow-300">
          <span className="text-3xl font-black text-zinc-950">乗り</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400">Norimono Mobility</span>
        </div>
      </div>
    </div>
  );
}

// Routes with clean transition
function AppRoutes() {
  const navigate = useNavigate();

  const handleLoginSuccess = (profile) => {
    if (profile.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <Routes>
      <Route path="/" element={<SmartRootRedirect />} />
      <Route path="/auth" element={<div className="flex items-center justify-center min-h-screen w-full bg-zinc-950"><AuthPortal onLoginSuccess={handleLoginSuccess} /></div>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/terms" element={<TermsModal standalone={true} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-950 w-full page-transition">
        <AppRoutes />
      </div>
      <AlertModal />
      <AIAssistant />
    </Router>
  );
}

export default App;
