import React, { useState, useEffect } from "react";
import { 
	Car, 
	Wallet, 
	ShieldCheck, 
	Leaf, 
	Clock, 
	Phone, 
	MessageSquare, 
	LogOut, 
	User, 
	Bell,
	Plus,
	ChevronDown,
	Scale
} from "lucide-react";
import WalletModal from "./WalletModal";
import DigitalIdCard from "./DigitalIdCard";
import { getCompanyInfo } from "../../utils/companyBadges";
import { getWalletData, subscribeToWallet } from "../../utils/walletService";

function Header({ 
	socket, 
	onPublishRide,
	hasVehicle = "0",
	onOpenVehicleModal,
	onOpenShowRegisteredVehicles,
	onOpenChat, 
	onOpenVoiceCall, 
	onOpenHistory, 
	onOpenFeedback, 
	onOpenProfile,
	onOpenImpact,
	onOpenTerms
}) {
	const [menuOpen, setMenuOpen] = useState(false);
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
			{/* Uber-Style Floating Top Bar */}
			<header className="fixed top-3 inset-x-3 md:top-4 md:inset-x-6 z-40 flex items-center justify-between pointer-events-none">
				{/* Left: Brand & Verified Tech Hub Badge */}
				<div className="flex items-center gap-2 pointer-events-auto">
					<div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.35)] text-white">
						<div className="w-7 h-7 bg-yellow-400 rounded-xl flex items-center justify-center text-black font-black shadow-[0_2px_8px_rgba(250,204,21,0.4)]">
							<Car className="w-4 h-4 stroke-[2.5]" />
						</div>
						<div className="flex flex-col text-left">
							<div className="flex items-center gap-1.5">
								<span className="text-sm font-black tracking-tight text-white">Norimono</span>
								<span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
							</div>
							<div className="flex items-center gap-1 text-[10px] text-yellow-300 font-bold">
								<span>{companyInfo.shortName}</span>
								<span className="text-neutral-400">• Verified</span>
							</div>
						</div>
					</div>
				</div>

				{/* Right: Dedicated Offer Ride Button, Wallet, and Menu */}
				<div className="flex items-center gap-2 pointer-events-auto">
					{/* Dedicated Offer Ride / Drive Button */}
					<button
						onClick={onPublishRide}
						className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-black text-xs transition-all duration-150 transform active:translate-y-0.5 cursor-pointer bg-yellow-400 hover:bg-yellow-300 text-black shadow-[0_3px_0_#CA8A04] active:shadow-none border border-yellow-500/50"
						title={hasVehicle === "2" ? "Publish a commute ride as verified driver" : "Offer a ride in your car"}
					>
						<Car className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
						<span className="hidden sm:inline">
							{hasVehicle === "2" ? "Publish Ride" : hasVehicle === "1" ? "Review Pending" : "Offer a Ride"}
						</span>
						<span className="sm:hidden">
							{hasVehicle === "2" ? "Publish" : "Drive"}
						</span>
					</button>

					{/* Wallet Pill Button */}
					<button
						onClick={() => setWalletModalOpen(true)}
						className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 text-white shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-neutral-900 transition-all cursor-pointer"
						title="Open Zero-Cash Commute Wallet"
					>
						<Wallet className="w-3.5 h-3.5 text-yellow-400" />
						<span className="text-xs font-mono font-black text-white">
							₹{walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
						</span>
					</button>

					{/* Profile Avatar / Digital ID Button */}
					<div className="relative">
						<button
							onClick={() => setMenuOpen(!menuOpen)}
							className="relative p-0.5 rounded-2xl border-2 border-yellow-400/80 hover:border-yellow-400 hover:scale-105 transition-all cursor-pointer bg-black shadow-[0_6px_16px_rgba(0,0,0,0.3)]"
							title="Open Profile Menu & Digital ID"
						>
							<div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-black text-xs">
								{user.name ? user.name.charAt(0).toUpperCase() : "U"}
							</div>
							<div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-md shadow-sm border border-black bg-white flex items-center justify-center p-0.5">
								<Logo />
							</div>
						</button>

						{/* Sleek Profile & Navigation Drawer / Dropdown */}
						{menuOpen && (
							<div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-neutral-200 overflow-hidden py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
								{/* User summary */}
								<div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/80">
									<p className="text-xs font-black text-black truncate">{user.name || "Employee"}</p>
									<p className="text-[10px] text-neutral-500 font-mono">{empId} • {companyInfo.shortName}</p>
									<div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
										<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300">
											<ShieldCheck className="w-2.5 h-2.5 text-amber-600" /> Closed-Loop
										</span>
										{hasVehicle === "2" ? (
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-black text-yellow-400">
												🚗 Driver Verified
											</span>
										) : hasVehicle === "1" ? (
											<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300">
												⏳ Driver Pending
											</span>
										) : null}
									</div>
								</div>

								{/* Menu Items */}
								<div className="p-1 space-y-0.5">
									<button
										onClick={() => {
											setMenuOpen(false);
											setDigitalIdOpen(true);
										}}
										className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
									>
										<ShieldCheck className="w-4 h-4 text-amber-600" /> Digital ID Card
									</button>

									<button
										onClick={() => {
											setMenuOpen(false);
											if (onOpenHistory) onOpenHistory();
										}}
										className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
									>
										<Clock className="w-4 h-4 text-neutral-700" /> Commute Activity & History
									</button>

									{onOpenImpact && (
										<button
											onClick={() => {
												setMenuOpen(false);
												onOpenImpact();
											}}
											className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
										>
											<Leaf className="w-4 h-4 text-emerald-600" /> ESG CO2 Impact Portal
										</button>
									)}

									{onOpenVoiceCall && (
										<button
											onClick={() => {
												setMenuOpen(false);
												onOpenVoiceCall();
											}}
											className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
										>
											<Phone className="w-4 h-4 text-neutral-700" /> Commute Voice Call
										</button>
									)}

									{onOpenChat && (
										<button
											onClick={() => {
												setMenuOpen(false);
												onOpenChat();
											}}
											className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
										>
											<MessageSquare className="w-4 h-4 text-neutral-700" /> Live Chat
										</button>
									)}

									{/* Dynamic Driver / Vehicle Action */}
									{(hasVehicle === "1" || hasVehicle === "2") ? (
										<button
											onClick={() => {
												setMenuOpen(false);
												if (onOpenShowRegisteredVehicles) onOpenShowRegisteredVehicles();
											}}
											className="w-full text-left px-3 py-2 text-xs text-black hover:bg-yellow-50 rounded-xl flex items-center justify-between font-bold transition-colors cursor-pointer group"
										>
											<span className="flex items-center gap-2.5">
												<Car className="w-4 h-4 text-black" />
												<span>Show Registered Vehicles</span>
											</span>
											{hasVehicle === "2" ? (
												<span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300">
													Verified
												</span>
											) : (
												<span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
													Pending
												</span>
											)}
										</button>
									) : (
										onOpenVehicleModal && (
											<button
												onClick={() => {
													setMenuOpen(false);
													onOpenVehicleModal();
												}}
												className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
											>
												<Car className="w-4 h-4 text-black" /> Register as Driver
											</button>
										)
									)}

									{onOpenProfile && (
										<button
											onClick={() => {
												setMenuOpen(false);
												onOpenProfile();
											}}
											className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
										>
											<User className="w-4 h-4 text-neutral-600" /> View Account Profile
										</button>
									)}

									{onOpenTerms && (
										<button
											onClick={() => {
												setMenuOpen(false);
												onOpenTerms();
											}}
											className="w-full text-left px-3 py-2 text-xs text-neutral-800 hover:bg-yellow-50 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
										>
											<Scale className="w-4 h-4 text-neutral-600" /> Terms & Commute Charter
										</button>
									)}

									<div className="h-px bg-neutral-100 my-1" />

									<button
										onClick={handleLogout}
										className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 font-black transition-colors cursor-pointer"
									>
										<LogOut className="w-4 h-4 text-rose-600" /> Sign Out
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Interactive Wallet Modal */}
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
