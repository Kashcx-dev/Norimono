import React, { useState, useEffect } from "react";
import { 
	X, 
	User, 
	Mail, 
	Building2, 
	Phone, 
	Car, 
	Star, 
	ShieldCheck, 
	FileText, 
	Droplets, 
	CalendarDays, 
	Wallet, 
	QrCode, 
	Lock, 
	KeyRound, 
	CheckCircle2, 
	AlertCircle, 
	Sparkles, 
	ArrowRight,
	Eye,
	EyeOff,
	ShieldAlert,
	Scale
} from "lucide-react";
import { getCompanyInfo } from "../../utils/companyBadges";
import WalletModal from "./WalletModal";

export default function ProfileModal({ isOpen, onClose, onOpenVehicleModal, onOpenTerms }) {
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showWalletModal, setShowWalletModal] = useState(false);
	const [showPasswordSection, setShowPasswordSection] = useState(false);

	// Change Password Form State
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPass, setShowPass] = useState(false);
	const [passLoading, setPassLoading] = useState(false);
	const [passSuccess, setPassSuccess] = useState("");
	const [passError, setPassError] = useState("");

	useEffect(() => {
		if (isOpen) {
			fetchProfile();
			setPassSuccess("");
			setPassError("");
			setShowPasswordSection(false);
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
			if (data.success && data.profile) {
				setProfile(data.profile);
			}
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleChangePassword = async (e) => {
		e.preventDefault();
		setPassError("");
		setPassSuccess("");

		if (!currentPassword || !newPassword) {
			setPassError("Please fill in both current and new password.");
			return;
		}

		if (newPassword.length < 6) {
			setPassError("New password must be at least 6 characters long.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setPassError("New passwords do not match.");
			return;
		}

		setPassLoading(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/auth/change-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					current_password: currentPassword,
					new_password: newPassword
				})
			});
			const data = await res.json();
			if (res.ok && data.success) {
				setPassSuccess(data.message || "Password changed successfully (secured with bcrypt)!");
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
				setTimeout(() => {
					setShowPasswordSection(false);
					setPassSuccess("");
				}, 2500);
			} else {
				setPassError(data.message || data.error || "Failed to change password.");
			}
		} catch (err) {
			console.error("Change password error:", err);
			setPassError("Network error. Please try again.");
		} finally {
			setPassLoading(false);
		}
	};

	if (!isOpen) return null;

	const compInfo = getCompanyInfo(profile?.org_name || "Enterprise");
	const CompanyLogo = compInfo.Logo;

	return (
		<>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 text-left">
				<div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col transform transition-all relative overflow-hidden border border-slate-200/80 max-h-[92vh]">
					
					{/* Header - Enterprise Brand Banner */}
					<div className="p-6 md:p-8 flex justify-between items-start bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 relative overflow-hidden text-white shrink-0">
						<div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
						
						<div className="flex items-center gap-4 sm:gap-5 relative z-10 min-w-0">
							{/* Framed Corporate Avatar Ring */}
							<div className="relative shrink-0">
								<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-xl flex items-center justify-center">
									<div className="w-full h-full rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-black text-2xl sm:text-3xl tracking-tight">
										{profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
									</div>
								</div>
								{/* Official Company Logo Badge */}
								<div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-md shadow-md border-2 border-slate-900 bg-white flex items-center justify-center p-0.5">
									<CompanyLogo />
								</div>
							</div>

							<div className="min-w-0 space-y-1">
								<div className="flex items-center gap-2 flex-wrap">
									<h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
										{profile?.name || "Employee Profile"}
									</h2>
									<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
										<ShieldCheck className="w-3 h-3 text-teal-300" />
										SSO Verified
									</span>
								</div>

								<p className="text-xs text-slate-300 font-medium">
									{profile?.designation || "Colleague"} • {profile?.department || "Technology"}
								</p>

								<p className="text-[11px] text-teal-300 font-mono font-bold flex items-center gap-1.5 pt-0.5">
									<span>{profile?.org_name || "Enterprise"}</span>
									<span>•</span>
									<span className="text-slate-300">{profile?.emp_id}</span>
								</p>
							</div>
						</div>
						
						<button 
							onClick={onClose}
							className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer z-10 border border-white/10 hover:scale-105 shrink-0 ml-2"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Body Content */}
					<div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/60 flex-1">
						{loading ? (
							<div className="flex justify-center items-center h-48 flex-col gap-3">
								<div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
								<p className="text-xs font-bold text-slate-500 animate-pulse">Loading employee profile...</p>
							</div>
						) : profile ? (
							<>
								{/* 1. PERSONAL COMMUTE WALLET & QR CODE CARD */}
								<div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md relative overflow-hidden">
									<div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

									<div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
										<div>
											<div className="flex items-center gap-2 mb-1">
												<Wallet className="w-4 h-4 text-teal-400" />
												<span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
													Personal Commute Wallet
												</span>
												<span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
													Closed-Loop
												</span>
											</div>
											<div className="flex items-baseline gap-1 mt-0.5">
												<span className="text-xl font-bold text-teal-300">₹</span>
												<span className="text-3xl font-black text-white font-mono tracking-tight">
													{(profile.wallet?.balance || 500).toLocaleString("en-IN", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</span>
											</div>
											<p className="text-[10px] text-slate-400 mt-1 max-w-sm">
												Non-withdrawable commute funds reserved strictly for carpool ride payments & fuel cost-sharing.
											</p>
										</div>

										<div className="flex items-center gap-2 w-full sm:w-auto">
											<button
												onClick={() => setShowWalletModal(true)}
												className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
											>
												<QrCode className="w-3.5 h-3.5" />
												<span>Wallet & QR</span>
											</button>
										</div>
									</div>
								</div>

								{/* 2. DUAL RATINGS SYSTEM (Customer Passenger Conduct + Driver Safety) */}
								<div className="space-y-2.5">
									<div className="flex items-center justify-between">
										<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
											<Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
											Verified Commute Ratings
										</h3>
										<span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
											{profile.total_rides_completed || 12} Trips Completed
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{/* Passenger / Customer Rating */}
										<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
													Customer / Passenger Rating
												</span>
												<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-extrabold text-xs border border-amber-200">
													<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
													<span>{profile.passenger_rating?.toFixed(1) || "4.9"}</span>
												</div>
											</div>
											<div>
												<h4 className="text-xs font-bold text-slate-900">Passenger Conduct & Etiquette</h4>
												<p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
													Rated by colleague drivers on punctuality at tech-park pickup, courteous communication, and in-cabin respect.
												</p>
											</div>
										</div>

										{/* Driver / Rider Rating */}
										<div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
													Driver / Rider Rating
												</span>
												<div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200">
													<Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
													<span>{profile.driving_rating?.toFixed(1) || "4.9"}</span>
												</div>
											</div>
											<div>
												<h4 className="text-xs font-bold text-slate-900">Route Safety & Vehicle Score</h4>
												<p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
													Rated by coworker passengers on safe navigation, cabin cleanliness, AC comfort, and reliable arrival times.
												</p>
											</div>
										</div>
									</div>
								</div>

								{/* 3. PERSONAL & WORK DETAILS */}
								<div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5">
									<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
										<User className="w-3.5 h-3.5 text-teal-600" />
										Corporate Identity Credentials
									</h3>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
										<div>
											<span className="text-[10px] font-bold text-slate-400 uppercase block">Official Email</span>
											<span className="font-mono font-bold text-slate-900">{profile.email}</span>
										</div>

										<div>
											<span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Phone</span>
											<span className="font-mono font-bold text-slate-900">{profile.phone || "Not provided"}</span>
										</div>

										<div>
											<span className="text-[10px] font-bold text-slate-400 uppercase block">Employer Organization</span>
											<span className="font-bold text-slate-900">{profile.org_name}</span>
										</div>

										<div>
											<span className="text-[10px] font-bold text-slate-400 uppercase block">Gender (Safety Filter)</span>
											<span className="font-bold text-slate-900 capitalize">{profile.gender || "Unspecified"}</span>
										</div>
									</div>
								</div>

								{/* 4. DRIVER VEHICLE PROFILE */}
								<div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
									<div className="flex items-center justify-between">
										<h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
											<Car className="w-3.5 h-3.5 text-yellow-500" />
											Registered Vehicle
										</h3>

										{profile.is_vehicle_registered === "2" ? (
											<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded border border-emerald-200 flex items-center gap-1">
												<ShieldCheck className="w-3 h-3 text-emerald-600" />
												Verified Driver
											</span>
										) : profile.is_vehicle_registered === "1" ? (
											<span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded border border-amber-200">
												Verification Pending Review
											</span>
										) : (
											<span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded">
												Passenger Mode
											</span>
										)}
									</div>

									{profile.vehicle ? (
										<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-sm font-black text-slate-900">{profile.vehicle.vehicle_model}</span>
												<span className="text-xs font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
													{profile.vehicle.veh_no}
												</span>
											</div>
											<div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/70 font-medium">
												<span>Capacity: <strong className="text-slate-800">{profile.vehicle.seating_capacity} Passenger Seats</strong></span>
												<span>DL: <strong className="text-slate-800 font-mono">{profile.vehicle.dl_no || "State License"}</strong></span>
											</div>
										</div>
									) : (
										<div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-600">
											<span>No vehicle registered under this corporate account.</span>
											{onOpenVehicleModal && (
												<button
													onClick={() => {
														onClose();
														onOpenVehicleModal();
													}}
													className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
												>
													Register Vehicle
												</button>
											)}
										</div>
									)}
								</div>

								{/* 5. SECURITY & PASSWORD MANAGEMENT (BCRYPT HASHING) */}
								<div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											<Lock className="w-3.5 h-3.5 text-slate-700" />
											<span className="text-xs font-black text-slate-800 uppercase tracking-wider">
												Security & Password
											</span>
										</div>
										<button
											type="button"
											onClick={() => setShowPasswordSection(!showPasswordSection)}
											className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
										>
											{showPasswordSection ? "Cancel" : "Change Password"}
										</button>
									</div>

									{passSuccess && (
										<div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
											<span>{passSuccess}</span>
										</div>
									)}

									{passError && (
										<div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
											<AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
											<span>{passError}</span>
										</div>
									)}

									{showPasswordSection && (
										<form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
											<div className="space-y-1">
												<label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Current Password</label>
												<input
													type={showPass ? "text" : "password"}
													value={currentPassword}
													onChange={(e) => setCurrentPassword(e.target.value)}
													placeholder="••••••••"
													className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
													required
												/>
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
												<div className="space-y-1">
													<label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">New Password</label>
													<input
														type={showPass ? "text" : "password"}
														value={newPassword}
														onChange={(e) => setNewPassword(e.target.value)}
														placeholder="At least 6 chars"
														className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
														required
													/>
												</div>
												<div className="space-y-1">
													<label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
													<input
														type={showPass ? "text" : "password"}
														value={confirmPassword}
														onChange={(e) => setConfirmPassword(e.target.value)}
														placeholder="Repeat new password"
														className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
														required
													/>
												</div>
											</div>

											<div className="flex items-center justify-between pt-1">
												<button
													type="button"
													onClick={() => setShowPass(!showPass)}
													className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
												>
													{showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
													<span>{showPass ? "Hide" : "Show"} Passwords</span>
												</button>

												<button
													type="submit"
													disabled={passLoading}
													className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
												>
													{passLoading ? "Securing with bcrypt..." : "Save Password"}
												</button>
											</div>
										</form>
									)}
								</div>

								{/* 6. LEGAL & WHITE-PLATE CHARTER */}
								<div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-4 flex items-center justify-between text-xs">
									<div className="flex items-center gap-2.5">
										<div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
											<Scale className="w-4 h-4" />
										</div>
										<div>
											<span className="font-bold text-slate-800 block text-xs">
												Terms of Service & White-Plate Charter
											</span>
											<span className="text-[10px] text-slate-500 block">
												MVA Sec 66/192A compliance, closed-loop wallet & safety rules
											</span>
										</div>
									</div>
									{onOpenTerms && (
										<button
											type="button"
											onClick={onOpenTerms}
											className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
										>
											View Charter <ArrowRight className="w-3 h-3 text-teal-600" />
										</button>
									)}
								</div>
							</>
						) : (
							<div className="text-center text-slate-500 text-sm py-12">Failed to load profile details.</div>
						)}
					</div>
				</div>
			</div>

			{/* Sub-Modal: Personal Commute Wallet */}
			{showWalletModal && (
				<WalletModal
					isOpen={showWalletModal}
					onClose={() => {
						setShowWalletModal(false);
						fetchProfile(); // Refresh balance on close
					}}
				/>
			)}
		</>
	);
}
