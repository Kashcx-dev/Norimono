import React, { useState } from "react";
import { User, Car, LogOut, Settings, Bell, Phone, MessageSquare, Calendar, MapPin } from "lucide-react";

function Header({ onOpenVehicleModal }) {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);

	const handleLogout = () => {
		sessionStorage.removeItem("token");
		sessionStorage.removeItem("user");
		window.location.href = "/";
	};

	return (
		<header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
			{/* Brand */}
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 bg-[#714B67] rounded-lg flex items-center justify-center">
					<Car className="w-5 h-5 text-white" />
				</div>
				<span className="text-xl font-bold text-gray-900 tracking-tight">
					MakeLyft
				</span>
			</div>

			{/* Notifications & User Profile */}
			<div className="flex items-center gap-4 relative">
				{/* Notifications Bell */}
				<div className="relative">
					<button
						onClick={() => {
							setNotificationsOpen(!notificationsOpen);
							setDropdownOpen(false);
						}}
						className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer relative"
					>
						<Bell className="w-5 h-5 text-gray-600" />
						{/* Notification Badge */}
						<span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
					</button>

					{notificationsOpen && (
						<div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-50">
							<div className="px-4 py-2 border-b border-gray-100">
								<h4 className="font-bold text-gray-900">Notifications</h4>
							</div>
							
							{/* Mock Accepted Ride */}
							<div className="p-4 bg-teal-50/30 hover:bg-teal-50/60 transition-colors border-b border-gray-50">
								<div className="flex justify-between items-start mb-2">
									<span className="text-xs font-bold px-2 py-1 bg-[#00A09D] text-white rounded-md uppercase tracking-wide">Ride Accepted</span>
									<span className="text-xs text-gray-500">Just now</span>
								</div>
								<p className="text-sm text-gray-800 mb-3">
									<span className="font-semibold">Rahul M.</span> has accepted your ride request!
								</p>
								
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
									<Calendar className="w-3.5 h-3.5 text-gray-400" />
									<span>Tomorrow, 9:30 AM</span>
								</div>
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
									<MapPin className="w-3.5 h-3.5 text-gray-400" />
									<span className="truncate">Adamas University → Howrah</span>
								</div>

								<div className="flex gap-2">
									<button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
										<Phone className="w-3.5 h-3.5" /> Call
									</button>
									<button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer">
										<MessageSquare className="w-3.5 h-3.5" /> Chat
									</button>
								</div>
							</div>
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
						className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer"
					>
					<User className="w-5 h-5 text-gray-600" />
				</button>

				{dropdownOpen && (
					<div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden py-1">
						<button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors">
							<Settings className="w-4 h-4 text-gray-400" /> Manage
							Profile
						</button>
						<button
							onClick={() => {
								setDropdownOpen(false);
								onOpenVehicleModal();
							}}
							className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
						>
							<Car className="w-4 h-4 text-gray-400" /> Register Vehicle
						</button>
						<div className="h-px bg-gray-100 my-1"></div>
						<button
							onClick={handleLogout}
							className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
						>
							<LogOut className="w-4 h-4 text-red-400" /> Logout
						</button>
					</div>
				)}
			</div>
			</div>
		</header>
	);
}

export default Header;
