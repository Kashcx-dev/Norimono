import React, { useState, useEffect } from "react";
import { X, User, Mail, Building2, Phone, Car, Star, ShieldCheck } from "lucide-react";

export default function ProfileModal({ isOpen, onClose }) {
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchProfile();
		}
	}, [isOpen]);

	const fetchProfile = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/auth/me", {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				setProfile(data.profile);
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	const renderRating = (rating) => {
		const val = parseFloat(rating || 0).toFixed(1);
		return (
			<div className="flex items-center gap-1 bg-amber-400/10 text-amber-500 px-2.5 py-1 rounded-md font-bold text-sm">
				<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
				{val}
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
			<div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-white/10 flex flex-col transform transition-all relative overflow-hidden">
				
				{/* Header */}
				<div className="p-5 flex justify-between items-start bg-gradient-to-r from-[#00A09D]/20 to-[#714B67]/20 relative">
					<div className="flex flex-col gap-3">
						<div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A09D] to-[#714B67] flex items-center justify-center text-white shadow-lg text-2xl font-bold uppercase border-2 border-white/20">
							{profile?.name?.charAt(0) || "U"}
						</div>
						<div>
							<h2 className="text-xl font-bold text-white leading-tight">{profile?.name || "Loading..."}</h2>
							<p className="text-sm font-mono text-white/50">{profile?.emp_id || "EMP_ID"}</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
					>
						<X className="w-4 h-4" />
					</button>
					
					{/* Abstract Background Design */}
					<div className="absolute right-0 top-0 w-32 h-32 bg-[#714B67]/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
				</div>

				<div className="p-6 space-y-6 flex-1 overflow-y-auto">
					{loading ? (
						<div className="flex justify-center items-center h-40">
							<div className="w-8 h-8 border-4 border-[#00A09D]/30 border-t-[#00A09D] rounded-full animate-spin"></div>
						</div>
					) : profile ? (
						<div className="space-y-4">
							{/* Ratings Row */}
							<div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
								<div className="flex-1 space-y-1">
									<p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Passenger Rating</p>
									{renderRating(profile.passenger_rating)}
								</div>
								<div className="w-px bg-white/10"></div>
								<div className="flex-1 space-y-1">
									<p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Driver Rating</p>
									{renderRating(profile.driving_rating)}
								</div>
							</div>

							{/* Personal Info */}
							<div className="space-y-3">
								<h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Personal Information</h3>
								
								<div className="flex gap-3 items-center p-3 rounded-lg bg-white/5 border border-white/5">
									<Mail className="w-5 h-5 text-[#00A09D]" />
									<div className="flex-1">
										<p className="text-[10px] uppercase text-white/50 font-bold">Email</p>
										<p className="text-sm text-white font-medium">{profile.email}</p>
									</div>
								</div>

								<div className="flex gap-3 items-center p-3 rounded-lg bg-white/5 border border-white/5">
									<Phone className="w-5 h-5 text-[#00A09D]" />
									<div className="flex-1">
										<p className="text-[10px] uppercase text-white/50 font-bold">Phone Number</p>
										<p className="text-sm text-white font-medium">{profile.phone || "Not provided"}</p>
									</div>
								</div>

								<div className="flex gap-3 items-center p-3 rounded-lg bg-white/5 border border-white/5">
									<Building2 className="w-5 h-5 text-[#714B67]" />
									<div className="flex-1">
										<p className="text-[10px] uppercase text-white/50 font-bold">Organization</p>
										<p className="text-sm text-white font-medium">{profile.org_name}</p>
									</div>
								</div>
							</div>

							{/* Vehicle Details */}
							<div className="space-y-3 pt-2">
								<h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Vehicle Details</h3>
								
								{profile.vehicle ? (
									<div className="flex gap-3 items-start p-4 rounded-xl bg-gradient-to-br from-[#714B67]/20 to-transparent border border-[#714B67]/30">
										<div className="p-2 bg-[#714B67] rounded-lg text-white">
											<Car className="w-5 h-5" />
										</div>
										<div className="flex-1">
											<div className="flex justify-between items-start">
												<div>
													<p className="text-sm text-white font-bold">{profile.vehicle.vehicle_model}</p>
													<p className="text-xs text-white/60 font-mono mt-0.5">{profile.vehicle.veh_no}</p>
												</div>
												<span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 border border-emerald-500/20">
													<ShieldCheck className="w-3 h-3" /> Verified
												</span>
											</div>
											<div className="mt-2 text-xs font-medium text-white/50 flex gap-2">
												<span>{profile.vehicle.seating_capacity} Seats Capacity</span>
											</div>
										</div>
									</div>
								) : (
									<div className="p-4 rounded-xl border border-white/10 border-dashed flex flex-col items-center justify-center gap-2 bg-white/5">
										<Car className="w-6 h-6 text-white/20" />
										<p className="text-xs text-white/40 font-medium">No vehicle registered</p>
									</div>
								)}
							</div>
						</div>
					) : (
						<div className="text-center text-white/50 text-sm">Failed to load profile.</div>
					)}
				</div>
			</div>
		</div>
	);
}
