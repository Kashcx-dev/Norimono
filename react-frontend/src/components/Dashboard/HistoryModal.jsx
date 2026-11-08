import React, { useState, useEffect } from "react";
import { X, Clock, MapPin, Search, ChevronRight, Car } from "lucide-react";

export default function HistoryModal({ isOpen, onClose }) {
	const [activeTab, setActiveTab] = useState("driver"); // "driver" or "passenger"
	const [loading, setLoading] = useState(false);
	const [historyData, setHistoryData] = useState([]);

	useEffect(() => {
		if (isOpen) {
			fetchHistory();
		}
	}, [isOpen, activeTab]);

	const fetchHistory = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const endpoint = activeTab === "driver" ? "/api/history/driver" : "/api/history/passenger";
			const res = await fetch(endpoint, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setHistoryData(data.history || []);
			}
		} catch (error) {
			console.error("Error fetching history:", error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
			<div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col transform transition-all h-[80vh] border border-gray-100 overflow-hidden">
				
				{/* Header - Tactile 3D Yellow / Obsidian */}
				<div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shrink-0" />
				<div className="p-6 bg-black relative shrink-0">
					<div className="flex justify-between items-center relative z-10">
						<div>
							<h2 className="text-2xl font-black text-white tracking-tight">Activity History</h2>
							<p className="text-zinc-400 text-sm font-medium mt-0.5">Review your past rides, carpools, and cost-share records</p>
						</div>
						<button 
							onClick={onClose}
							className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Custom Tabs */}
					<div className="flex gap-4 mt-6 relative z-10">
						<button
							onClick={() => setActiveTab("driver")}
							className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === "driver" ? "text-yellow-400" : "text-zinc-400 hover:text-white"}`}
						>
							Driver Activity
							{activeTab === "driver" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-md"></div>
							)}
						</button>
						<button
							onClick={() => setActiveTab("passenger")}
							className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${activeTab === "passenger" ? "text-yellow-400" : "text-zinc-400 hover:text-white"}`}
						>
							Passenger Activity
							{activeTab === "passenger" && (
								<div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400 rounded-t-md"></div>
							)}
						</button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
					{loading ? (
						<div className="flex flex-col justify-center items-center h-40 gap-3">
							<div className="w-8 h-8 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin"></div>
							<p className="text-sm font-bold text-gray-400">Loading History...</p>
						</div>
					) : historyData.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
							<div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
								<Search className="w-8 h-8 text-gray-300" />
							</div>
							<p className="text-gray-900 font-bold">No history found</p>
							<p className="text-xs text-gray-500 mt-1 max-w-[200px]">You haven't completed any rides in this role yet.</p>
						</div>
					) : (
						<div className="space-y-4">
							{historyData.map((item, idx) => (
								<div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex items-center justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 mb-3">
											<span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
												item.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
												item.status === 'cancelled' ? "bg-rose-50 text-rose-700 border-rose-200" :
												"bg-blue-50 text-blue-700 border-blue-200"
											}`}>
												{item.status || "Unknown"}
											</span>
											<span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
												<Clock className="w-3.5 h-3.5" />
												{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
											</span>
										</div>
										
										<div className="space-y-2">
											<div className="flex items-start gap-2.5">
												<MapPin className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
												<p className="text-sm font-bold text-gray-900 truncate">
													{typeof item.origin === 'string' ? item.origin : item.origin?.name || "Origin Point"}
												</p>
											</div>
											<div className="flex items-start gap-2.5">
												<MapPin className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
												<p className="text-sm font-bold text-gray-900 truncate">
													{typeof item.destination === 'string' ? item.destination : item.destination?.name || "Destination Point"}
												</p>
											</div>
										</div>
									</div>

									<div className="text-right flex flex-col items-end gap-3 shrink-0">
										<div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
											<span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Fare</span>
											<span className="font-black text-black">₹{item.fare || "45.00"}</span>
										</div>
										<button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-yellow-400 group-hover:text-black group-hover:text-white transition-colors border border-gray-200 cursor-pointer">
											<ChevronRight className="w-4 h-4" />
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
