import React, { useState, useEffect } from "react";
import { Users, Car, Settings, LogOut, Search, Activity, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("metrics");
  const [metrics, setMetrics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [settings, setSettings] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }
    fetchMetrics();
    fetchEmployees();
    fetchVehicles();
    fetchSettings();
  }, [token, navigate]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/admin/metrics", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMetrics(data.metrics);
    } catch (err) { console.error("Error fetching metrics", err); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/admin/employees", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
    } catch (err) { console.error("Error fetching employees", err); }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/admin/vehicles", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) { console.error("Error fetching vehicles", err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/admin/settings", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSettings(data.settings);
    } catch (err) { console.error("Error fetching settings", err); }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert("Settings updated successfully!");
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full text-left">
      {/* Admin Header */}
      <header className="bg-[#2D3748] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4A5568] rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-teal-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">MakeLyft Admin Control</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 py-6 px-4 hidden md:block shadow-sm">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("metrics")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "metrics" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Activity className="w-5 h-5" /> Participation Overview
            </button>
            <button onClick={() => setActiveTab("employees")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "employees" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Users className="w-5 h-5" /> Employees & Access
            </button>
            <button onClick={() => setActiveTab("vehicles")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "vehicles" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Car className="w-5 h-5" /> Registered Vehicles
            </button>
            <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === "settings" ? "bg-teal-50 text-teal-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Settings className="w-5 h-5" /> Org Configurations
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Metrics Tab */}
          {activeTab === "metrics" && metrics && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-bold text-gray-900">Platform Participation</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm font-semibold mb-2">Total Employees</div>
                  <div className="text-4xl font-bold text-gray-900">{metrics.total_employees}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm font-semibold mb-2">Registered Vehicles</div>
                  <div className="text-4xl font-bold text-gray-900">{metrics.total_vehicles}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm font-semibold mb-2">Total Rides Published</div>
                  <div className="text-4xl font-bold text-teal-600">{metrics.total_rides_published}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-gray-500 text-sm font-semibold mb-2">Active Rides</div>
                  <div className="text-4xl font-bold text-rose-600">{metrics.active_rides}</div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Manage Employees</h2>
                <button className="px-4 py-2 bg-[#00A09D] hover:bg-[#008f8c] text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer">
                  + Add Employee Access
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                      <th className="p-4 font-semibold">Employee ID</th>
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Role</th>
                      <th className="p-4 font-semibold">Driver Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {employees.map((emp) => (
                      <tr key={emp.emp_id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{emp.emp_id}</td>
                        <td className="p-4 text-gray-700">{emp.name}</td>
                        <td className="p-4 text-gray-500">{emp.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${emp.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="p-4">
                          {emp.is_vehicle_registered ? (
                            <span className="text-teal-600 font-semibold flex items-center gap-1"><Car className="w-4 h-4"/> Registered</span>
                          ) : (
                            <span className="text-gray-400">Passenger only</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vehicles Tab */}
          {activeTab === "vehicles" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl font-bold text-gray-900">Registered Vehicles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => (
                  <div key={v.veh_id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                    <div className="absolute top-4 right-4 bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
                      {v.veh_no}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{v.vehicle_model}</div>
                        <div className="text-xs text-gray-500">Seats: {v.seating_capacity}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 uppercase font-semibold">Owner</div>
                      <div className="text-sm text-gray-900 font-medium">{v.driver_name}</div>
                      <div className="text-xs text-gray-500">{v.driver_email}</div>
                    </div>
                  </div>
                ))}
                {vehicles.length === 0 && <div className="text-gray-500">No vehicles registered yet.</div>}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Organization Configurations</h2>
              <form onSubmit={handleUpdateSettings} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fuel Cost per Km (₹)</label>
                    <input 
                      type="number" step="0.01" 
                      value={settings.fuel_cost_per_km || ''} 
                      onChange={e => setSettings({...settings, fuel_cost_per_km: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A09D]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Travel Cost per Km (₹)</label>
                    <input 
                      type="number" step="0.01" 
                      value={settings.travel_cost_per_km || ''} 
                      onChange={e => setSettings({...settings, travel_cost_per_km: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A09D]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Max Rides Publishable per Day (Per Driver)</label>
                    <input 
                      type="number" 
                      value={settings.max_rides_per_day || ''} 
                      onChange={e => setSettings({...settings, max_rides_per_day: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A09D]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-lg shadow-sm transition-colors">
                    <Save className="w-4 h-4" /> Save Configurations
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
