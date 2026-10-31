import React, { useState, useEffect } from "react";
import {
	Leaf,
	Car,
	ShieldCheck,
	TrendingUp,
	Users,
	Building2,
	Clock,
	Sliders,
	Award,
	Download,
	Sparkles,
	CheckCircle2,
	ArrowUpRight,
	Percent,
	Calendar
} from "lucide-react";
import { CompanyLogos } from "../../utils/companyBadges";

export default function ImpactScreen({ onClose }) {
	const [impactData, setImpactData] = useState({
		total_carpools_completed: 1842,
		parking_spaces_freed_today: 142,
		co2_saved_kg: 4420,
		trees_planted_equivalent: 221,
		fuel_expenses_saved_inr: 268000,
		facility_overhead_saved_inr: 639000,
		peak_queue_reduction_pct: 38.5,
		corporate_partners: [
			{ name: "Tata Consultancy Services (TCS)", rides: 589, co2_kg: 1414, parking_saved: 44, logoKey: "TCS" },
			{ name: "Infosys Technologies", rides: 478, co2_kg: 1105, parking_saved: 37, logoKey: "Infosys" },
			{ name: "Wipro Technologies", rides: 331, co2_kg: 840, parking_saved: 26, logoKey: "Wipro" },
			{ name: "Google & Neighboring Peers", rides: 444, co2_kg: 1061, parking_saved: 35, logoKey: "Google" }
		],
		simulation_baseline: {
			base_employees: 1250,
			average_single_occupancy_vehicles: 820,
			parking_capacity: 650,
			gate_peak_minutes: 42
		}
	});

	// Interactive Digital Traffic Simulation State (From Pitch Deck Ask)
	const [adoptionRate, setAdoptionRate] = useState(35); // 10% to 100%
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) return;
		fetch("/admin/esg-impact", {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(res => res.json())
			.then(data => {
				if (data.success && data.impact) {
					setImpactData(prev => ({ ...prev, ...data.impact }));
				}
			})
			.catch(err => console.warn("Impact data load:", err));
	}, []);

	// Dynamic Traffic Simulation Math based on Employee Density
	const baseVehicles = impactData.simulation_baseline.average_single_occupancy_vehicles;
	const simulatedVehiclesRemoved = Math.round((baseVehicles * (adoptionRate / 100)) * 0.68);
	const simulatedParkingFreed = Math.round(simulatedVehiclesRemoved * 1.4);
	const simulatedQueueMinutes = Math.max(8, Math.round(impactData.simulation_baseline.gate_peak_minutes * (1 - (adoptionRate * 0.0075))));
	const simulatedMonthlyFacilitySavings = Math.round(simulatedParkingFreed * 4500); // ₹4,500/spot/month
	const simulatedAnnualCO2Tons = ((simulatedVehiclesRemoved * 2.4 * 240) / 1000).toFixed(1);

	return (
		<div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn select-none pb-12">
			{/* Executive Pitch Deck Header Banner */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-8 md:p-10 border border-slate-800 shadow-2xl">
				{/* Subtle background glow */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div className="space-y-3 max-w-2xl">
						<div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-bold uppercase tracking-widest">
							<Sparkles className="w-3.5 h-3.5" />
							<span>Enterprise Facility & ESG Portal</span>
						</div>
						<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
							Norimono Campus Impact Dashboard
						</h1>
						<p className="text-slate-300 text-sm leading-relaxed">
							Real-time facility optimization and carbon reduction metrics for tech park HR directors and facility managers. 
							Quantifying parking real estate efficiency and Scope 3 ESG emissions.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
						<div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
							<div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
							<div className="text-left">
								<div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Live Facility Feed</div>
								<div className="text-xs font-bold text-white">Active Tech Hub Corridor</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Core 4 Executive KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* 1. Parking Spaces Freed Up Today */}
				<div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4 group-hover:scale-105 transition-transform">
						<Car className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Parking Spaces Freed</div>
						<div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
							<span>{impactData.parking_spaces_freed_today}</span>
							<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">+18% today</span>
						</div>
						<p className="text-[11px] text-slate-500 font-medium">1-2 bays per carpool saved in Basements 1 & 2</p>
					</div>
				</div>

				{/* 2. CO2 Emissions Saved */}
				<div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
						<Leaf className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">CO2 Emissions Avoided</div>
						<div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
							<span>{impactData.co2_saved_kg}</span>
							<span className="text-sm font-bold text-slate-400">kg</span>
						</div>
						<p className="text-[11px] text-slate-500 font-medium">Equivalent to {impactData.trees_planted_equivalent} mature trees planted</p>
					</div>
				</div>

				{/* 3. Total Carpool Commutes */}
				<div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-105 transition-transform">
						<Users className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Total Commutes Completed</div>
						<div className="text-3xl font-black text-slate-900 tracking-tight">
							{impactData.total_carpools_completed.toLocaleString("en-IN")}
						</div>
						<p className="text-[11px] text-slate-500 font-medium">100% verified closed-loop colleague rides</p>
					</div>
				</div>

				{/* 4. Workforce Commute Expense Saved */}
				<div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
					<div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform">
						<TrendingUp className="w-6 h-6" />
					</div>
					<div className="space-y-1">
						<div className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Fuel Costs Saved by Staff</div>
						<div className="text-3xl font-black text-slate-900 tracking-tight">
							₹{(impactData.fuel_expenses_saved_inr / 1000).toFixed(0)}k
						</div>
						<p className="text-[11px] text-slate-500 font-medium">Direct cost-sharing benefit returned to staff</p>
					</div>
				</div>
			</div>

			{/* Interactive Digital Traffic Simulation (Pitch Deck Feature) */}
			<div className="bg-slate-900 text-white rounded-3xl border border-slate-800 p-8 shadow-xl relative overflow-hidden">
				<div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

				<div className="relative z-10 space-y-6">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
						<div>
							<div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-400 mb-1">
								<Sliders className="w-4 h-4" />
								<span>Pilot Pitch Simulation Tool</span>
							</div>
							<h3 className="text-2xl font-black text-white">Digital Campus Traffic & Congestion Simulator</h3>
							<p className="text-xs text-slate-400">
								Slide employee carpool adoption to project congestion and parking relief for a 30-day closed beta pilot.
							</p>
						</div>

						{/* Slider Control */}
						<div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 min-w-[280px]">
							<div className="flex justify-between items-center mb-2">
								<span className="text-xs font-semibold text-slate-300">Staff Adoption Rate:</span>
								<span className="text-base font-black text-teal-400">{adoptionRate}%</span>
							</div>
							<input
								type="range"
								min="10"
								max="90"
								step="5"
								value={adoptionRate}
								onChange={(e) => setAdoptionRate(parseInt(e.target.value))}
								className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
							/>
							<div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
								<span>10% (Phase 1)</span>
								<span>50% (Campus Hub)</span>
								<span>90% (Zero Congestion)</span>
							</div>
						</div>
					</div>

					{/* Projected Results Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
						<div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
							<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Vehicles Removed Daily</div>
							<div className="text-3xl font-black text-teal-300">{simulatedVehiclesRemoved}</div>
							<p className="text-[11px] text-slate-400 mt-1">Single-occupancy cars removed from arterial access roads</p>
						</div>

						<div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
							<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Parking Spots Liberated</div>
							<div className="text-3xl font-black text-emerald-300">{simulatedParkingFreed} bays</div>
							<p className="text-[11px] text-slate-400 mt-1">Saved facility real estate for EV charging or landscaping</p>
						</div>

						<div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
							<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Peak Gate Ingress Time</div>
							<div className="text-3xl font-black text-sky-300">{simulatedQueueMinutes} mins</div>
							<p className="text-[11px] text-slate-400 mt-1">Down from 42 mins baseline bottleneck at Main Campus Gate</p>
						</div>

						<div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
							<div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Annual Facility Savings</div>
							<div className="text-3xl font-black text-amber-300">₹{(simulatedMonthlyFacilitySavings * 12 / 100000).toFixed(1)}L</div>
							<p className="text-[11px] text-slate-400 mt-1">Avoided commercial parking lease & security management</p>
						</div>
					</div>
				</div>
			</div>

			{/* Corporate Tech Hub Partner Distribution */}
			<div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 shadow-sm">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
					<div>
						<h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Tech Park Corporate Partners</h3>
						<p className="text-xs text-slate-500">Cross-organization participation breakdown across verified campus corridors</p>
					</div>
					<div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
						<Building2 className="w-3.5 h-3.5 text-slate-700" />
						<span>Manyata & Electronic City Corridors</span>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					{impactData.corporate_partners.map((partner, idx) => {
						const LogoComponent = CompanyLogos[partner.logoKey] || CompanyLogos.Generic;
						return (
							<div key={idx} className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5 hover:border-slate-300 transition-colors">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-xl bg-white shadow-xs p-1 border border-slate-200 flex items-center justify-center shrink-0">
										<LogoComponent />
									</div>
									<div className="min-w-0">
										<h4 className="text-sm font-bold text-slate-900 truncate">{partner.name}</h4>
										<span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
											<CheckCircle2 className="w-3 h-3" /> SSO Verified
										</span>
									</div>
								</div>

								<div className="space-y-2 text-xs">
									<div className="flex justify-between text-slate-600">
										<span>Commutes Shared:</span>
										<span className="font-bold text-slate-900">{partner.rides}</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>CO2 Abated:</span>
										<span className="font-bold text-emerald-600">{partner.co2_kg} kg</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>Parking Bays Saved:</span>
										<span className="font-bold text-slate-900">{partner.parking_saved}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

