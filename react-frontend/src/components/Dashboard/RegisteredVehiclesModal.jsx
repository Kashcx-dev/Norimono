import React, { useState, useEffect } from "react";
import { 
	X, 
	Car, 
	ShieldCheck, 
	Clock, 
	FileText, 
	Users, 
	Fuel, 
	Plus, 
	Sparkles, 
	CheckCircle2, 
	AlertTriangle,
	ArrowRight
} from "lucide-react";
import { getCompanyInfo } from "../../utils/companyBadges";

export default function RegisteredVehiclesModal({ 
	isOpen, 
	onClose, 
	onOpenRegisterNew, 
	onPublishRide,
	hasVehicle = "0"
}) {
	const [vehicleData, setVehicleData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState(hasVehicle);

	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const companyInfo = getCompanyInfo(user.org_name || user.email);

	useEffect(() => {
		if (isOpen) {
			fetchVehicleDetails();
		}
	}, [isOpen]);

	const fetchVehicleDetails = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/register-vehicle", {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setVehicleData(data.vehicle);
				if (data.is_vehicle_registered) {
					setStatus(data.is_vehicle_registered);
				}
			}
		} catch (err) {
			console.error("Failed to fetch registered vehicle:", err);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	const isApproved = status === "2";
	const isPending = status === "1";

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
			<div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-left">
				{/* Header */}
				<div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-[#714B67] flex items-center justify-center font-bold">
							<Car className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-base font-black text-slate-900 tracking-tight">
								Registered Vehicles
							</h3>
							<p className="text-xs text-slate-500">
								Your vehicles registered for corporate carpool commutes
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Body */}
				<div className="p-6 overflow-y-auto space-y-4">
					{loading ? (
						<div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
							<div className="w-7 h-7 border-2 border-[#714B67] border-t-transparent rounded-full animate-spin"></div>
							<p className="text-xs font-semibold">Loading vehicle credentials...</p>
						</div>
					) : vehicleData ? (
						<div className="space-y-4">
							{/* Vehicle Card */}
							<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex items-center gap-3">
										<div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-inner">
											<Car className="w-6 h-6 text-teal-400" />
										</div>
										<div>
											<h4 className="text-base font-black text-slate-900 tracking-tight">
												{vehicleData.vehicle_model || "Maruti Swift"}
											</h4>
											<span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase mt-0.5 inline-block">
												{vehicleData.veh_no}
											</span>
										</div>
									</div>

									{/* Status Pill */}
									{isApproved ? (
										<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
											<span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
											✓ Verified
										</span>
									) : isPending ? (
										<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
											<span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
											⏳ Pending Review
										</span>
									) : (
										<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
											Unverified
										</span>
									)}
								</div>

								{/* Detailed Spec Grid */}
								<div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
									<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
										<span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
											<FileText className="w-3 h-3 text-slate-500" /> Driving License
										</span>
										<p className="font-mono font-bold text-slate-800 truncate">
											{vehicleData.dl_no || "DL Verified"}
										</p>
									</div>

									<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
										<span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
											<Users className="w-3 h-3 text-teal-600" /> Seating Capacity
										</span>
										<p className="font-bold text-slate-800">
											{vehicleData.seating_capacity || 4} Passenger Seats
										</p>
									</div>

									{vehicleData.insurance_no && (
										<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
											<span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
												<ShieldCheck className="w-3 h-3 text-indigo-500" /> Insurance Policy
											</span>
											<p className="font-mono font-bold text-slate-800 truncate">
												{vehicleData.insurance_no}
											</p>
										</div>
									)}

									<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
										<span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
											<Fuel className="w-3 h-3 text-amber-500" /> Fuel Multiplier
										</span>
										<p className="font-bold text-slate-800">
											{parseFloat(vehicleData.fuel_consumption_ratio || 1.0).toFixed(1)}x Standard
										</p>
									</div>
								</div>

								{/* Status Explanation Banner */}
								{isApproved ? (
									<div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
										<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
										<p className="text-[11px] leading-relaxed">
											<strong>Norimono Verified:</strong> Your vehicle and credentials have been verified by your enterprise administrator. You can publish rides and receive automated wallet settlements.
										</p>
									</div>
								) : isPending ? (
									<div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
										<Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
										<p className="text-[11px] leading-relaxed">
											<strong>Under Administrative Review:</strong> Your credentials have been submitted to the safety queue. You will be able to publish rides as soon as approval is granted.
										</p>
									</div>
								) : null}
							</div>

							{/* Actions */}
							<div className="flex items-center gap-3 pt-2">
								{isApproved && onPublishRide && (
									<button
										onClick={() => {
											onClose();
											onPublishRide();
										}}
										className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
									>
										<span>Publish Commute Ride</span>
										<ArrowRight className="w-4 h-4" />
									</button>
								)}
								{onOpenRegisterNew && (
									<button
										onClick={() => {
											onClose();
											onOpenRegisterNew();
										}}
										className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
									>
										<Plus className="w-3.5 h-3.5" />
										<span>Update Vehicle</span>
									</button>
								)}
							</div>
						</div>
					) : (
						/* Empty State */
						<div className="py-10 text-center space-y-4">
							<div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
								<Car className="w-8 h-8" />
							</div>
							<div>
								<h4 className="text-base font-bold text-slate-900">No Vehicle Registered Yet</h4>
								<p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
									Register your vehicle with your driver license to start offering rides and sharing commute fuel costs.
								</p>
							</div>
							{onOpenRegisterNew && (
								<button
									onClick={() => {
										onClose();
										onOpenRegisterNew();
									}}
									className="py-3 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									<span>Register as Driver</span>
								</button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

