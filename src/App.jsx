import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPortal from "./components/AuthPortal";
import "./App.css";

function App() {
  const handleLoginSuccess = (profile) => {
    // You can handle global state here if needed, or rely on localStorage
    console.log("Logged in:", profile);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPortal onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/dashboard" element={
            <div className="p-8 text-center bg-white rounded-xl shadow-md">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome to the Dashboard!</p>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  window.location.href = "/auth";
                }}
                className="mt-4 px-4 py-2 bg-[#714B67] text-white rounded-lg cursor-pointer"
              >
                Logout
              </button>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
