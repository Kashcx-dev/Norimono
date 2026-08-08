import React, { useState, useEffect } from "react";
import { X, Clock, MapPin, Navigation, IndianRupee, CheckCircle2, Car, User } from "lucide-react";

export default function HistoryModal({ isOpen, onClose }) {
	const [activeTab, setActiveTab] = useState("passenger"); // passenger | driver
	const [history, setHistory] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		fetchHistory(activeTab);
	}, [isOpen, activeTab]);

	const fetchHistory = async (type) => {
		setLoading(true);
		setHistory([]);
		const token = localStorage.getItem("token");
		try {
			const endpoint = type === "driver" ? "/history/driver" : "/history/passenger";
			const res = await fetch(endpoint, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setHistory(data.history || []);
			}
		} catch (error) {
			console.error("Error fetching history:", error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	const renderAddress = (addrStr) => {
		try {
			const addr = typeof addrStr === 'string' ? JSON.parse(addrStr) : addrStr;
			return addr.display_name || addr.address || "Unknown Location";
		} catch (e) {
			return "Unknown Location";
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString('en-IN', {
			day: 'numeric', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	};

	const getStatusBadge = (status) => {
		const styles = {
			scheduled: "bg-amber-500/10 text-amber-500 border-amber-500/20",
			in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
			completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
			cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
			picked_up: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
		};
		const style = styles[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
		
		return (
			<span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${style}`}>
				{status?.replace('_', ' ')}
			</span>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
			<div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
				
				{/* Header */}
				<div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A09D] to-[#714B67] flex items-center justify-center text-white shadow-lg">
							<Clock className="w-5 h-5" />
						</div>
						<div>
							<h2 className="text-lg font-bold text-white leading-tight">Your History</h2>
							<p className="text-xs text-white/50">Past rides and bookings</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex px-4 pt-4 gap-2">
					<button
						onClick={() => setActiveTab("passenger")}
						className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl font-bold text-sm transition-all cursor-pointer border-b-2 ${
							activeTab === "passenger"
								? "bg-white/10 text-[#00A09D] border-[#00A09D]"
								: "text-white/60 border-transparent hover:bg-white/5"
						}`}
					>
						<User className="w-4 h-4" /> Rides Booked
					</button>
					<button
						onClick={() => setActiveTab("driver")}
						className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl font-bold text-sm transition-all cursor-pointer border-b-2 ${
							activeTab === "driver"
								? "bg-white/10 text-[#714B67] border-[#714B67]"
								: "text-white/60 border-transparent hover:bg-white/5"
						}`}
					>
						<Car className="w-4 h-4" /> Rides Published
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-48 space-y-4">
							<div className="w-8 h-8 border-4 border-[#00A09D]/30 border-t-[#00A09D] rounded-full animate-spin"></div>
							<p className="text-white/50 text-sm font-medium">Loading history...</p>
						</div>
					) : history.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-48 space-y-3 bg-white/5 rounded-xl border border-white/10 border-dashed">
							<Clock className="w-10 h-10 text-white/20" />
							<p className="text-white/50 text-sm font-medium">No {activeTab === "driver" ? "rides published" : "bookings found"} yet.</p>
						</div>
					) : (
						history.map((item, idx) => (
							<div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
								<div className="flex justify-between items-start mb-3">
									<div className="text-xs font-bold text-white/50 flex items-center gap-1.5">
										<Clock className="w-3.5 h-3.5" />
										{formatDate(activeTab === "passenger" ? item.booking_date : item.created_at)}
									</div>
									{getStatusBadge(activeTab === "passenger" ? item.booking_status : item.status)}
								</div>

								<div className="space-y-3 relative">
									{/* Connecting line */}
									<div className="absolute left-[11px] top-[14px] bottom-[14px] w-[2px] bg-white/10"></div>
									
									<div className="flex items-start gap-3 relative z-10">
										<div className="w-6 h-6 rounded-full bg-[#00A09D]/20 text-[#00A09D] flex items-center justify-center mt-0.5 shrink-0">
											<MapPin className="w-3.5 h-3.5" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-[#00A09D] uppercase tracking-wider">Pickup</p>
											<p className="text-sm font-medium text-white line-clamp-1">
												{renderAddress(activeTab === "passenger" ? item.pickup_location : item.origin)}
											</p>
										</div>
									</div>

									<div className="flex items-start gap-3 relative z-10">
										<div className="w-6 h-6 rounded-full bg-[#714B67]/20 text-[#714B67] flex items-center justify-center mt-0.5 shrink-0">
											<Navigation className="w-3.5 h-3.5" />
										</div>
										<div>
											<p className="text-[10px] font-bold text-[#714B67] uppercase tracking-wider">Dropoff</p>
											<p className="text-sm font-medium text-white line-clamp-1">
												{renderAddress(item.destination)}
											</p>
										</div>
									</div>
								</div>

								<div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
									<div className="flex items-center gap-1.5 text-emerald-400">
										<IndianRupee className="w-4 h-4" />
										<span className="font-bold text-lg leading-none">
											{activeTab === "passenger" ? item.fare_amount : item.fare_per_seat}
										</span>
									</div>
									
									<div className="flex gap-3 text-xs font-semibold text-white/60">
										{activeTab === "driver" ? (
											<div className="flex items-center gap-1">
												<User className="w-3.5 h-3.5" />
												{item.total_seats - item.available_seats} / {item.total_seats} booked
											</div>
										) : (
											<div>Ride #{item.ride_id}</div>
										)}
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
