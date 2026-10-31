import React, { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Wallet, Car, Settings, User, Clock, Phone, MessageSquare, MessageSquareHeart, Plus, Calendar, MapPin, ShieldCheck, Leaf, Sparkles, Award } from "lucide-react";
import WalletModal from "./WalletModal";
import RoleToggle from "./RoleToggle";
import DigitalIdCard from "./DigitalIdCard";
import { getCompanyInfo } from "../../utils/companyBadges";
import { getWalletData, subscribeToWallet } from "../../utils/walletService";

function Header({ 
	socket, 
	onOpenVehicleModal, 
	onOpenChat, 
	onOpenVoiceCall, 
	onOpenHistory, 
	onOpenFeedback, 
	onOpenProfile,
	currentRole = "passenger",
	onToggleRole,
	onOpenImpact
}) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);
	const [walletModalOpen, setWalletModalOpen] = useState(false);
	const [digitalIdOpen, setDigitalIdOpen] = useState(false);
	const [walletBalance, setWalletBalance] = useState(650.0);
	const [notifications, setNotifications] = useState([]);

	const user = JSON.parse(localStorage.getItem("user") || "{}");
	const empId = user.emp_id || "EMP-DEFAULT";
	const companyInfo = getCompanyInfo(user.org_name || user.email);
	const Logo = companyInfo.Logo;

	useEffect(() => {
		if (!socket) return;
		const handleNotif = (data) => {
			if (data.target_emp_id === empId || data.target_emp_id === "all") {
				setNotifications(prev => [data, ...prev]);
			}
		};
		socket.on("new_notification", handleNotif);
		return () => socket.off("new_notification", handleNotif);
	}, [socket, empId]);

	useEffect(() => {
		getWalletData(empId).then((data) => {
			if (data && typeof data.balance === "number") {
				setWalletBalance(data.balance);
			}
		});

		const unsubscribe = subscribeToWallet((updatedWallet) => {
			if (updatedWallet && typeof updatedWallet.balance === "number") {
				setWalletBalance(updatedWallet.balance);
			}
		});

		return () => unsubscribe();
	}, [empId]);

	const handleLogout = async () => {
		try {
			await fetch("/auth/logout", { method: "POST" });
		} catch (err) {}
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.location.href = "/";
	};

	return (
		<>
			<header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
				{/* Left: Brand & Verified Tech Hub Badge */}
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md border border-slate-800">
						<Car className="w-5 h-5 text-teal-400" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xl font-black text-slate-900 tracking-tight">
								Norimono
							</span>
							<span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
								<ShieldCheck className="w-3 h-3 text-teal-600" />
								Enterprise
							</span>
						</div>
						<p className="text-[10px] text-slate-400 font-semibold tracking-wide hidden md:block">
							Closed-Loop Corporate Mobility
						</p>
					</div>
				</div>

				{/* Center: Commute Mode Segmented Switcher (Role Toggle) */}
				<div className="hidden sm:flex items-center">
					<RoleToggle
						currentRole={currentRole}
						onToggleRole={onToggleRole}
						isVehicleRegistered={user.is_vehicle_registered || "0"}
						onRequestVehicleReg={onOpenVehicleModal}
					/>
				</div>

				{/* Right: ESG Impact, Wallet, Notifications & Digital ID Card */}
				<div className="flex items-center gap-2.5 md:gap-3.5 relative">
					{/* B2B ESG Impact Screen Link Button */}
					{onOpenImpact && (
						<button
							onClick={onOpenImpact}
							className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
							title="View Corporate ESG & Facility Impact Portal (Pitch Deck Showcase)"
						>
							<Leaf className="w-3.5 h-3.5 text-emerald-600" />
							<span>ESG Impact</span>
						</button>
					)}

					{/* Wallet Pill Button */}
					<button
						onClick={() => {
							setWalletModalOpen(true);
							setDropdownOpen(false);
							setNotificationsOpen(false);
						}}
						className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/80 shadow-2xs transition-all cursor-pointer group"
						title="Open Zero-Cash Commute Wallet"
					>
						<div className="w-6 h-6 rounded-lg bg-slate-900 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
							<Wallet className="w-3.5 h-3.5" />
						</div>
						<div className="text-left flex flex-col leading-tight">
							<span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Zero-Cash</span>
							<span className="text-xs font-extrabold text-slate-900 font-mono">
								₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
							</span>
						</div>
					</button>

					{/* Digital ID Card Avatar Framed by Company Logo */}
					<div className="relative">
						<button
							onClick={() => setDigitalIdOpen(true)}
							className="relative p-0.5 rounded-2xl border-2 hover:scale-105 transition-all cursor-pointer"
							style={{ borderColor: companyInfo.color }}
							title="Open Digital ID Card & Trust Credential"
						>
							<div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
								{user.name ? user.name.charAt(0).toUpperCase() : "U"}
							</div>
							{/* Company Logo Badge Framing Ring */}
							<div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md shadow-sm border border-white bg-white flex items-center justify-center p-0.5">
								<Logo />
							</div>
						</button>
					</div>

					{/* Notifications Bell */}
					<div className="relative">
						<button
							onClick={() => {
								setNotificationsOpen(!notificationsOpen);
								setDropdownOpen(false);
							}}
							className="flex items-center justify-center w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer relative"
						>
							<Bell className="w-4 h-4 text-slate-600" />
							{notifications.length > 0 && (
								<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
							)}
						</button>

						{notificationsOpen && (
							<div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-50">
								<div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
									<h4 className="font-bold text-gray-900">Notifications</h4>
									{notifications.length > 0 && (
										<span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
									)}
								</div>
								
								{notifications.length === 0 ? (
									<div className="p-6 text-center text-gray-500 text-sm font-semibold">
										No new notifications
									</div>
								) : (
									<div className="max-h-[350px] overflow-y-auto">
										{notifications.map((notif, idx) => (
											<div key={idx} className="p-4 bg-teal-50/30 hover:bg-teal-50/60 transition-colors border-b border-gray-50 text-left">
												<div className="flex justify-between items-start mb-2">
													<span className={`text-[10px] font-bold px-2 py-1 text-white rounded-md uppercase tracking-wide ${notif.type === 'request' ? 'bg-[#714B67]' : 'bg-[#00A09D]'}`}>
														{notif.title}
													</span>
													<span className="text-xs text-gray-500">
														{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</span>
												</div>
												<p className="text-sm text-gray-800 mb-3">
													{notif.message}
												</p>
												
												<div className="flex gap-2">
													<button 
														onClick={() => {
															setNotificationsOpen(false);
															if (onOpenVoiceCall) onOpenVoiceCall();
														}}
														className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
													>
														<Phone className="w-3.5 h-3.5" /> Call
													</button>
													<button 
														onClick={() => {
															setNotificationsOpen(false);
															if (onOpenChat) onOpenChat();
														}}
														className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
													>
														<MessageSquare className="w-3.5 h-3.5" /> Chat
													</button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}
					</div>

					{/* User Profile */}
					<div className="relative">
						<button
							onClick={() => {
								setDropdownOpen(!dropdownOpen);
								setNotificationsOpen(false);
							}}
							className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 cursor-pointer"
						>
							<User className="w-5 h-5 text-gray-600" />
						</button>

						{dropdownOpen && (
							<div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 text-left">
								<div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
									<p className="text-xs font-bold text-gray-900 truncate">{user.name || "Employee"}</p>
									<p className="text-[10px] text-gray-500 font-mono">{empId}</p>
									<div className="mt-1">
										{user.rider_type === "rider" ? (
											user.is_vehicle_registered === "2" ? (
												<span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
													🚗 Driver (Verified)
												</span>
											) : (
												<span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
													⏳ Driver (Pending Review)
												</span>
											)
										) : (
											<span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
												🚶‍♂️ Passenger
											</span>
										)}
									</div>
								</div>
								<button
									onClick={() => {
										setDropdownOpen(false);
										setWalletModalOpen(true);
									}}
									className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50/50 hover:text-[#714B67] flex items-center justify-between cursor-pointer transition-colors"
								>
									<span className="flex items-center gap-2">
										<Wallet className="w-4 h-4 text-[#714B67]" /> Commute Wallet
									</span>
									<span className="text-xs font-bold text-emerald-600 font-mono">
										₹{walletBalance.toFixed(0)}
									</span>
								</button>
								<button
									onClick={() => {
										setDropdownOpen(false);
										onOpenVehicleModal();
									}}
									className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
								>
									<Car className="w-4 h-4 text-gray-400" /> Register Vehicle
								</button>
								<button 
									onClick={() => {
										setDropdownOpen(false);
										setDigitalIdOpen(true);
									}}
									className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<ShieldCheck className="w-4 h-4 text-emerald-500" /> Digital ID Card
								</button>
								<button 
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenProfile) onOpenProfile();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<User className="w-4 h-4" /> Profile Details
								</button>
								<button 
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenHistory) onOpenHistory();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<Clock className="w-4 h-4" /> View History
								</button>
								<button 
									onClick={() => {
										setDropdownOpen(false);
										if (onOpenFeedback) onOpenFeedback();
									}}
									className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors font-medium"
								>
									<MessageSquareHeart className="w-4 h-4" /> Send Feedback
								</button>
								<button 
									onClick={handleLogout}
									className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors font-medium mt-1 border-t border-gray-100"
								>
									<LogOut className="w-4 h-4 text-red-400" /> Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Render Interactive Wallet Modal */}
			<WalletModal
				isOpen={walletModalOpen}
				onClose={() => setWalletModalOpen(false)}
			/>

			{/* Digital ID Card Modal */}
			{digitalIdOpen && (
				<DigitalIdCard
					user={user}
					showModal={true}
					onClose={() => setDigitalIdOpen(false)}
				/>
			)}
		</>
	);
}

export default Header;
