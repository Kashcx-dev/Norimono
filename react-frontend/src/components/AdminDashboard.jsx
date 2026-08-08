import React, { useState, useEffect } from "react";
import {
  Users,
  Car,
  Settings,
  LogOut,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  Fuel,
  Sparkles,
  Save,
  Bell,
  ShieldCheck,
  MapPin,
  Building2,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import carModels from "../data/car_models.json";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("employees"); // 'employees' | 'vehicles' | 'settings'
  const [metrics, setMetrics] = useState({
    total_employees: 48,
    total_vehicles: 22,
    rides_this_month: 163,
    active_rides: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [settings, setSettings] = useState({});
  
  // Modals & UI states
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({
    name: "",
    email: "",
    department: "Engineering",
    manager: "A. Shah",
    location: "Ahmedabad",
    role: "employee",
  });

  // New Vehicle Form State
  const [newVeh, setNewVeh] = useState({
    emp_id: "",
    vehicle_model: "Swift Dzire",
    veh_no: "",
    seating_capacity: 4,
    fuel_consumption_ratio: 16.0,
  });

  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    fetchMetrics();
    fetchEmployees();
    fetchVehicles();
    fetchSettings();
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/admin/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
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
      if (data.success && data.employees) {
        setEmployees(data.employees);
      }
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
      if (data.success && data.vehicles) {
        setVehicles(data.vehicles);
      }
    } catch (err) {
      console.error("Error fetching vehicles", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Error fetching settings", err);
    }
  };

  // Add Employee Handler
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/admin/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEmp),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Employee added successfully!");
        setShowAddEmployeeModal(false);
        setNewEmp({
          name: "",
          email: "",
          department: "Engineering",
          manager: "A. Shah",
          location: "Ahmedabad",
          role: "employee",
        });
        fetchEmployees();
        fetchMetrics();
      } else {
        alert(data.message || "Failed to add employee");
      }
    } catch (err) {
      console.error(err);
      alert("Error creating employee");
    }
  };

  // Toggle Employee Access
  const handleToggleAccess = async (emp_id) => {
    try {
      const res = await fetch("/admin/employees/toggle-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emp_id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Vehicle Handler
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/admin/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newVeh),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Vehicle registered successfully!");
        setShowAddVehicleModal(false);
        setNewVeh({
          emp_id: "",
          vehicle_model: "Swift Dzire",
          veh_no: "",
          seating_capacity: 4,
          fuel_consumption_ratio: 16.0,
        });
        fetchVehicles();
        fetchEmployees();
        fetchMetrics();
      } else {
        alert(data.message || "Failed to add vehicle");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding vehicle");
    }
  };

  // Toggle Vehicle Status
  const handleToggleVehicleStatus = async (veh_id) => {
    try {
      const res = await fetch("/admin/vehicles/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ veh_id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVehicles();
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings Handler
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
        showToast("Organization configurations saved!");
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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/");
  };

  // Filter Employees
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter Vehicles
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.veh_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col w-full text-left font-sans antialiased">
      {/* Top Navbar Matching Wireframe Header */}
      <header className="bg-white border-b border-gray-200/90 px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        {/* Left: Company Logo & Active Tab Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center shadow-xs">
              <Car className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-gray-900 tracking-tight">
              MakeLyft
            </span>
          </div>

          <div className="h-5 w-px bg-gray-200"></div>

          <span className="text-base font-bold text-[#00A09D] capitalize">
            {activeTab === "employees"
              ? "Employees"
              : activeTab === "vehicles"
              ? "Vehicles"
              : "Settings"}
          </span>
        </div>

        {/* Right: Admin Indicator & Profile Dropdown */}
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200 cursor-pointer relative"
          >
            <Bell className="w-4.5 h-4.5 text-gray-600" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#00A09D] rounded-full ring-2 ring-white"></span>
          </button>

          {/* Admin User Badge */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors border border-gray-200 cursor-pointer"
            >
              <span className="text-xs font-bold text-gray-800">Admin</span>
              <div className="w-6 h-6 rounded-full bg-[#E27D60] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user.name || "System Admin"}
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
                  <ArrowRightLeft className="w-4 h-4 text-[#714B67]" />
                  Switch to Employee Dashboard
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

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6 flex-1">
        {/* Toast Notification */}
        {successToast && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in duration-150 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 1. TOP METRICS BANNER (Matching Wireframe Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Employees Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Total Employees
            </div>
            <div className="text-4xl font-extrabold text-[#00A09D] tracking-tight">
              {metrics.total_employees}
            </div>
          </div>

          {/* Registered Vehicles Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Registered Vehicles
            </div>
            <div className="text-4xl font-extrabold text-[#00A09D] tracking-tight">
              {metrics.total_vehicles}
            </div>
          </div>

          {/* Rides This Month Card */}
          <div className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Rides This Month
            </div>
            <div className="text-4xl font-extrabold text-[#00A09D] tracking-tight">
              {metrics.rides_this_month}
            </div>
          </div>
        </div>

        {/* 2. TAB SWITCHER BUTTONS (Matching Wireframe Layout) */}
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("employees");
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "employees"
                  ? "bg-white text-[#714B67] border-[#714B67] shadow-xs"
                  : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Employees
            </button>

            <button
              onClick={() => {
                setActiveTab("vehicles");
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "vehicles"
                  ? "bg-white text-[#714B67] border-[#714B67] shadow-xs"
                  : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Vehicles
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                setSearchTerm("");
              }}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activeTab === "settings"
                  ? "bg-white text-[#714B67] border-[#714B67] shadow-xs"
                  : "bg-transparent text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              Settings
            </button>
          </div>

          {/* Search Input for Employees/Vehicles */}
          {activeTab !== "settings" && (
            <div className="relative w-64 hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
              />
            </div>
          )}
        </div>

        {/* 3. TAB CONTENT */}

        {/* --- TAB: EMPLOYEES (Matching Image 1) --- */}
        {activeTab === "employees" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-[#00A09D]">
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Email</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Manager</th>
                      <th className="py-3.5 px-6">Location</th>
                      <th className="py-3.5 px-6 text-right">Platform Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => {
                        const isGranted =
                          (emp.platform_access || "Granted").toLowerCase() === "granted";
                        return (
                          <tr
                            key={emp.emp_id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="py-4 px-6 font-bold text-gray-900">
                              {emp.name}
                            </td>
                            <td className="py-4 px-6 font-mono text-gray-600">
                              {emp.email}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {emp.department || "Engineering"}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {emp.manager || "A. Shah"}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {emp.location || "Ahmedabad"}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleToggleAccess(emp.emp_id)}
                                title="Click to toggle access"
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  isGranted
                                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                    : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                                }`}
                              >
                                {isGranted ? "[Granted]" : "[Revoked]"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* + Add Employee Button (Matching Wireframe) */}
            <div>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="px-5 py-2.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: VEHICLES (Matching Image 2) --- */}
        {activeTab === "vehicles" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold text-[#00A09D]">
                      <th className="py-3.5 px-6">Registration Number</th>
                      <th className="py-3.5 px-6">Model</th>
                      <th className="py-3.5 px-6">Seating Capacity</th>
                      <th className="py-3.5 px-6">Driver</th>
                      <th className="py-3.5 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((v) => {
                        const isActive =
                          (v.status || "Active").toLowerCase() === "active";
                        return (
                          <tr
                            key={v.veh_id}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="py-4 px-6 font-mono font-bold text-gray-900 uppercase">
                              {v.veh_no}
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-800">
                              {v.vehicle_model}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {v.seating_capacity}
                            </td>
                            <td className="py-4 px-6 font-medium text-gray-900">
                              {v.driver_name || "Unassigned"}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleToggleVehicleStatus(v.veh_id)}
                                title="Click to toggle status"
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                    : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                                }`}
                              >
                                {isActive ? "[Active]" : "[Inactive]"}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          No vehicles registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* + Add Vehicle Button (Matching Wireframe) */}
            <div>
              <button
                onClick={() => setShowAddVehicleModal(true)}
                className="px-5 py-2.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Vehicle
              </button>
            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS --- */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white border border-gray-200/90 rounded-2xl p-6 shadow-2xs space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Organization Configurations
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage fuel cost calculations, employee commute subsidy, and daily ride limits.
              </p>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Fuel Cost per Km (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fuel_cost_per_km || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, fuel_cost_per_km: e.target.value })
                  }
                  placeholder="5.50"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Travel Cost per Km Subsidy (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.travel_cost_per_km || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, travel_cost_per_km: e.target.value })
                  }
                  placeholder="2.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Max Rides Publishable per Day (Per Driver)
                </label>
                <input
                  type="number"
                  value={settings.max_rides_per_day || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, max_rides_per_day: e.target.value })
                  }
                  placeholder="5"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? "Saving..." : "Save Configurations"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD EMPLOYEE */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#00A09D]/10 rounded-lg flex items-center justify-center text-[#00A09D]">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Add Employee</h3>
              </div>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="e.g. Raj Patel"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Corporate Email
                </label>
                <input
                  required
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  placeholder="raj.patel@co.com"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Department
                  </label>
                  <select
                    value={newEmp.department}
                    onChange={(e) =>
                      setNewEmp({ ...newEmp, department: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Manager
                  </label>
                  <input
                    type="text"
                    value={newEmp.manager}
                    onChange={(e) =>
                      setNewEmp({ ...newEmp, manager: e.target.value })
                    }
                    placeholder="e.g. A. Shah"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEmp.location}
                  onChange={(e) =>
                    setNewEmp({ ...newEmp, location: e.target.value })
                  }
                  placeholder="Ahmedabad"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00A09D] hover:bg-[#008f8c] rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VEHICLE */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#714B67]/10 rounded-lg flex items-center justify-center text-[#714B67]">
                  <Car className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Add Vehicle</h3>
              </div>
              <button
                onClick={() => setShowAddVehicleModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Assign to Employee
                </label>
                <select
                  required
                  value={newVeh.emp_id}
                  onChange={(e) => setNewVeh({ ...newVeh, emp_id: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                >
                  <option value="" disabled>
                    Select an employee
                  </option>
                  {employees.map((emp) => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Vehicle Model
                </label>
                <select
                  required
                  value={newVeh.vehicle_model}
                  onChange={(e) =>
                    setNewVeh({ ...newVeh, vehicle_model: e.target.value })
                  }
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                >
                  {carModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Registration Number
                </label>
                <input
                  required
                  type="text"
                  value={newVeh.veh_no}
                  onChange={(e) =>
                    setNewVeh({ ...newVeh, veh_no: e.target.value.toUpperCase() })
                  }
                  placeholder="GJ01AB1234"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="8"
                    value={newVeh.seating_capacity}
                    onChange={(e) =>
                      setNewVeh({ ...newVeh, seating_capacity: e.target.value })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                    Mileage (km/L)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={newVeh.fuel_consumption_ratio}
                    onChange={(e) =>
                      setNewVeh({
                        ...newVeh,
                        fuel_consumption_ratio: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVehicleModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#714B67] hover:bg-[#5c3c54] rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
