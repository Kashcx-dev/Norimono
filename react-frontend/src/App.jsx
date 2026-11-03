import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "./components/AuthPortal";
import Dashboard from "./components/Dashboard/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import AlertModal from "./components/Dashboard/AlertModal";
import AIAssistant from "./components/Dashboard/AIAssistant";
import TermsModal from "./components/Dashboard/TermsModal";
import "./App.css";
import SplashScreen from "./components/SplashScreen";

// We extract the routes into a separate component so we can use the `useNavigate` hook 
// (which must be inside a <Router> context).
function AppRoutes() {
  const navigate = useNavigate();

  const handleLoginSuccess = (profile) => {
    console.log("Logged in:", profile);
    if (profile.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/auth" element={<div className="flex items-center justify-center min-h-screen w-full"><AuthPortal onLoginSuccess={handleLoginSuccess} /></div>} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/terms" element={<TermsModal standalone={true} />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 w-full page-transition">
        <AppRoutes />
      </div>
      <AlertModal />
      <AIAssistant />
    </Router>
  );
}

export default App;
