import React from "react";
import { Search, Car, ShieldCheck, AlertCircle, Sparkles } from "lucide-react";

export default function RoleToggle({ 
	currentRole = "passenger", // 'passenger' | 'rider'
	onToggleRole, 
	isVehicleRegistered = "0", // '0' = not reg, '1' = pending, '2' = approved
	onRequestVehicleReg 
}) {
	const isOffering = currentRole === "rider";

	const handleSelect = (mode) => {
		if (mode === currentRole) return;

		if (mode === "rider") {
			if (isVehicleRegistered !== "2") {
				if (onRequestVehicleReg) {
					onRequestVehicleReg(isVehicleRegistered);
				}
				return;
			}
		}

		if (onToggleRole) {
			onToggleRole(mode);
		}
	};

	return (
		<div className="inline-flex items-center p-1 bg-slate-100/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-inner select-none">
			{/* Finding a Ride (Passenger) */}
			<button
				type="button"
				onClick={() => handleSelect("passenger")}
				className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
					!isOffering
						? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
						: "text-slate-500 hover:text-slate-800"
				}`}
			>
				<Search className={`w-3.5 h-3.5 ${!isOffering ? "text-cyan-600" : "text-slate-400"}`} />
				<span>Finding a Ride</span>
			</button>

			{/* Offering a Ride (Driver) */}
			<button
				type="button"
				onClick={() => handleSelect("rider")}
				className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer relative ${
					isOffering
						? "bg-slate-900 text-white shadow-sm border border-slate-800"
						: "text-slate-500 hover:text-slate-800"
				}`}
			>
				<Car className={`w-3.5 h-3.5 ${isOffering ? "text-teal-400" : "text-slate-400"}`} />
				<span>Offering a Ride</span>
				{isVehicleRegistered !== "2" && !isOffering && (
					<span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
				)}
			</button>
		</div>
	);
}
