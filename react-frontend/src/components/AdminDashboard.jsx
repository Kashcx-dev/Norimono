import React, { useState, useEffect } from "react";
import {
  Users,
  Car,
  Settings,
  LogOut,
  Search,
  Activity,
  Save,
  Bell,
  User,
  Shield,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  TrendingUp,
  Fuel,
  ArrowRightLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("metrics");
  const [metrics, setMetrics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [settings, setSettings] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchMetrics();
    fetchEmployees();
    fetchVehicles();
    fetchSettings();
  }, [token, navigate]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMetrics(data.metrics);
    } catch (err) {
      console.error("Error fetching metrics", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/admin/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch (err) {
      console.error("Error fetching employees", err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/admin/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) {
      console.error("Error fetching vehicles", err);
    }
  };

  const handleApproveVehicle = async (veh_id) => {
    try {
      const res = await fetch("/admin/vehicles/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ veh_id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Vehicle approved successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
        fetchVehicles();
        fetchEmployees();
      } else {
        alert("Failed to approve vehicle: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error approving vehicle");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch("/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Organization settings saved successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.emp_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col w-full text-left font-sans">
      {/* Header / Navbar - Matching Employee Navbar with Odoo Branding */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        {/* Brand & Admin Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#714B67] rounded-xl flex items-center justify-center shadow-xs">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              MakeLyft
            </span>
            <span className="px-2.5 py-0.5 bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Right Section: Notifications & User Profile */}
        <div className="flex items-center gap-3.5 relative">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setDropdownOpen(false);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200 cursor-pointer relative"
              title="Admin Alerts"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00A09D] rounded-full border-2 border-white"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900">System Notifications</h4>
                  <span className="text-xs font-semibold text-[#00A09D] bg-teal-50 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/40 border-b border-gray-50 flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#714B67]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-[#714B67]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Admin Control Active</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      You are logged in with organization-level management privileges.
                    </p>
                  </div>
                </div>

                {vehicles.some((v) => v.is_vehicle_registered === "1") && (
                  <div className="p-3.5 bg-amber-50/60 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900">Vehicles Pending Approval</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        New vehicle registrations require administrative verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#714B67] text-white flex items-center justify-center font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <span className="text-xs font-bold text-gray-700 hidden sm:inline-block">
                {user.name || "Admin"}
              </span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user.name || "Administrator"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email || ""}</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/dashboard");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-[#714B67]/5 hover:text-[#714B67] flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#714B67]" />
                  Switch to Employee View
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab("settings");
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Org Configurations
                </button>

                <div className="h-px bg-gray-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {/* Main Container with Sidebar + Content */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border border-gray-200/80 rounded-2xl p-4 hidden md:flex flex-col justify-between shadow-xs shrink-0 self-start">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Management
            </div>

            <button
              onClick={() => setActiveTab("metrics")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-[#714B67] text-white shadow-sm shadow-[#714B67]/20"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Participation Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("employees")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "employees"
                  ? "bg-[#714B67] text-white shadow-sm shadow-[#714B67]/20"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Employees & Access</span>
            </button>

            <button
              onClick={() => setActiveTab("vehicles")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "vehicles"
                  ? "bg-[#714B67] text-white shadow-sm shadow-[#714B67]/20"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>Registered Vehicles</span>
              {vehicles.filter((v) => v.is_vehicle_registered === "1").length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 bg-amber-400 text-amber-950 text-[10px] font-extrabold rounded-full">
                  {vehicles.filter((v) => v.is_vehicle_registered === "1").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#714B67] text-white shadow-sm shadow-[#714B67]/20"
                  : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Org Configurations</span>
            </button>
          </div>

          {/* Switch to Employee App Quick Action */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 px-3 bg-[#00A09D]/10 hover:bg-[#00A09D]/20 text-[#00A09D] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Employee Dashboard
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: Metrics Overview */}
          {activeTab === "metrics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Participation Overview
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real-time operational metrics of MakeLyft enterprise carpooling.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Platform Data
                  </span>
                </div>
              </div>

              {metrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Metric 1 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Total Employees
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                      {metrics.total_employees}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Verified organization accounts</p>
                  </div>

                  {/* Metric 2 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Registered Vehicles
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center">
                        <Car className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                      {metrics.total_vehicles}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Vehicles in carpool fleet</p>
                  </div>

                  {/* Metric 3 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Total Published Rides
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#714B67]">
                      {metrics.total_rides_published}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Commutes shared to date</p>
                  </div>

                  {/* Metric 4 */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Active / Scheduled
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#00A09D]">
                      {metrics.active_rides}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Rides in progress or planned</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
                  Loading metrics...
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Employees & Roles */}
          {activeTab === "employees" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Employees & Access
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View registered users, roles, and carpool driver authorizations.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, ID, email..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
                  />
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <th className="p-4">Employee ID</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Driver Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <tr key={emp.emp_id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{emp.emp_id}</td>
                            <td className="p-4 font-semibold text-gray-800">{emp.name}</td>
                            <td className="p-4 text-gray-500">{emp.email}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                                  emp.role === "admin"
                                    ? "bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20"
                                    : "bg-[#00A09D]/10 text-[#00A09D] border border-[#00A09D]/20"
                                }`}
                              >
                                {emp.role === "admin" ? "⚡ Admin" : "👤 Employee"}
                              </span>
                            </td>
                            <td className="p-4">
                              {emp.is_vehicle_registered === "2" ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved Driver
                                </span>
                              ) : emp.is_vehicle_registered === "1" ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium">Passenger</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400">
                            No employees found matching "{searchTerm}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Registered Vehicles */}
          {activeTab === "vehicles" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Registered Vehicles
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Review and verify employee carpool vehicles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {vehicles.map((v) => (
                  <div
                    key={v.veh_id}
                    className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between"
                  >
                    {/* Header: Badge & Icon */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            v.is_vehicle_registered === "1"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[#714B67]/10 text-[#714B67]"
                          }`}
                        >
                          <Car className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                            v.is_vehicle_registered === "1"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {v.is_vehicle_registered === "1" ? "Pending Approval" : "Approved"}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h4 className="font-extrabold text-base text-gray-900">
                          {v.vehicle_model}
                        </h4>
                        <p className="text-xs font-mono font-bold text-[#714B67] mt-0.5">
                          {v.veh_no}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-xl mb-4 text-xs">
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">
                            Capacity
                          </span>
                          <span className="font-bold text-gray-800">
                            {v.seating_capacity} Seats
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px] uppercase font-bold">
                            Fuel Ratio
                          </span>
                          <span className="font-bold text-gray-800">
                            {v.fuel_consumption_ratio} km/L
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 text-xs">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">
                          Owner
                        </span>
                        <p className="font-bold text-gray-800">{v.driver_name}</p>
                        <p className="text-gray-500 truncate">{v.driver_email}</p>
                      </div>
                    </div>

                    {/* Action Button for Pending */}
                    {v.is_vehicle_registered === "1" && (
                      <div className="pt-4 mt-2">
                        <button
                          onClick={() => handleApproveVehicle(v.veh_id)}
                          className="w-full py-2.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Vehicle
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {vehicles.length === 0 && (
                  <div className="col-span-3 bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
                    No vehicles registered yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Org Settings */}
          {activeTab === "settings" && (
            <div className="space-y-5 animate-in fade-in duration-200 max-w-2xl">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Organization Configurations
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set corporate carpooling subsidies, fare parameters, and publishing limits.
                </p>
              </div>

              <form
                onSubmit={handleUpdateSettings}
                className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-6"
              >
                <div className="space-y-4">
                  {/* Fuel Cost */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Fuel Cost per Km (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.fuel_cost_per_km || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, fuel_cost_per_km: e.target.value })
                        }
                        placeholder="5.50"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all font-semibold"
                      />
                      <Fuel className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Baseline corporate benchmark used for ride fare calculations.
                    </p>
                  </div>

                  {/* Travel Cost */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Travel Allowance Subsidy per Km (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={settings.travel_cost_per_km || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, travel_cost_per_km: e.target.value })
                        }
                        placeholder="2.00"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all font-semibold"
                      />
                      <Sparkles className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Max Rides */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Max Rides Publishable per Day (Per Driver)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.max_rides_per_day || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, max_rides_per_day: e.target.value })
                        }
                        placeholder="5"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all font-semibold"
                      />
                      <Car className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Safety cap on daily driver departures.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-75"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettings ? "Saving..." : "Save Configurations"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
