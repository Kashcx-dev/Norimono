import React, { useState } from "react";
import { User, Car, LogOut, Settings } from "lucide-react";

function Header({ onOpenVehicleModal }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center">
          <Car className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">MakeLyft</span>
      </div>

      {/* User Profile / Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer"
        >
          <User className="w-5 h-5 text-gray-600" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-1">
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors">
              <Settings className="w-4 h-4 text-gray-400" /> Manage Pro
            </button>
            <button
              onClick={() => {
                setDropdownOpen(false);
                onOpenVehicleModal();
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Car className="w-4 h-4 text-gray-400" /> Register Vehicle
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
