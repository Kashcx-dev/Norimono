import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthPortal from "./components/AuthPortal";
import Dashboard from "./components/Dashboard/Dashboard";
import "./App.css";

// We extract the routes into a separate component so we can use the `useNavigate` hook 
// (which must be inside a <Router> context).
function AppRoutes() {
  const navigate = useNavigate();

  const handleLoginSuccess = (profile) => {
    // User is logged in, redirect them to the dashboard
    console.log("Logged in:", profile);
    navigate("/dashboard");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<div className="flex items-center justify-center min-h-screen w-full"><AuthPortal onLoginSuccess={handleLoginSuccess} /></div>} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 w-full">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
