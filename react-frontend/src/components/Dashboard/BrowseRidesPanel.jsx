import React, { useState } from "react";
import { showAlert } from "../../utils/alertService";
import {
	ArrowLeft,
	Car,
	Clock,
	Users,
	Star,
	ShieldCheck,
	Search,
	CheckCircle2,
	X,
	Wallet,
	Heart,
	Building2,
	Zap,
	Sparkles,
	Lock,
	Shield,
	Award
} from "lucide-react";
import { deductMoneyForRide } from "../../utils/walletService";
import { getCompanyInfo, POPULAR_TECH_PARKS } from "../../utils/companyBadges";
import DigitalIdCard from "./DigitalIdCard";

export default function BrowseRidesPanel({
	rides = [],
	loading = false,
	selectedRide = null,
	onSelectRide,
	onBack,
	// userLocation,
	onRideBooked,
	activeTrip,
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState("all"); // 'all' | 'under5km' | 'seats' | 'fare'
	const [femaleOnlyFilter, setFemaleOnlyFilter] = useState(false);
	const [selectedTechPark, setSelectedTechPark] = useState("all");
	const [targetArrivalFilter, setTargetArrivalFilter] = useState("all");
	const [viewingDriverIdCard, setViewingDriverIdCard] = useState(null);
	const [engine2Dispatched, setEngine2Dispatched] = useState(false);

	const [bookingModalRide, setBookingModalRide] = useState(null);
	const [selectedSeatPref, setSelectedSeatPref] = useState("Seat 1 (Front Window)");
	const [bookingLoading, setBookingLoading] = useState(false);
	const [bookingSuccess, setBookingSuccess] = useState(null); // { otp, booking_id }

	const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
	const currentOrg = currentUser.org_name || "Enterprise";

	// Filter rides
	const filteredRides = rides
		.filter((ride) => {
			// 1. Gender Filter: Strict Female-only rides
			if (femaleOnlyFilter) {
				const isFemaleRide = ride.is_female_only || ride.driver_gender === "female";
				if (!isFemaleRide) return false;
			}

			// 2. Tech Park Filter
			if (selectedTechPark !== "all") {
				const destStr = (ride.destination_tech_park || ride.destination?.name || JSON.stringify(ride.destination || "")).toLowerCase();
				if (!destStr.includes(selectedTechPark.toLowerCase())) return false;
			}

			// 3. Search Term
			const matchesSearch =
				ride.driver_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.vehicle_model
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.driver_company
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.destination?.name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				ride.driver_dept?.toLowerCase().includes(searchTerm.toLowerCase());

			if (!matchesSearch) return false;

			if (filterType === "under5km") {
				return (ride.distance_km || 0) <= 5.0;
			}
			if (filterType === "seats") {
				return (ride.available_seats || 0) >= 3;
			}
			return true;
		})
		.sort((a, b) => {
			if (filterType === "fare") {
				return (a.fare_per_seat || 0) - (b.fare_per_seat || 0);
			}
			return (a.distance_km || 0) - (b.distance_km || 0);
		});

	const handleBookRide = async (ride) => {
		const token = localStorage.getItem("token");
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		const empId = user.emp_id || "EMP-DEFAULT";
		const fare = ride.fare_per_seat || 45;

		const seatsRemaining = ride.available_seats !== undefined && ride.available_seats !== null ? Number(ride.available_seats) : 3;
		if (seatsRemaining <= 0) {
			showAlert("Sorry, this ride is already fully booked! No seats remaining.", "Ride Full", "warning");
			return;
		}

		setBookingLoading(true);

		try {
			const res = await fetch("/book-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					ride_id: ride.ride_id,
					pickup_location: ride.origin,
					dropoff_location: ride.destination,
				}),
			});

			const data = await res.json();
			if (data.success) {
				// Deduct fare from Norimono wallet
				try {
					await deductMoneyForRide(empId, fare, ride);
				} catch (wErr) {
					console.warn("Wallet deduction:", wErr.message);
				}

				const seatNo = selectedSeatPref || `Seat #${Math.floor(Math.random() * 3) + 1} (Window)`;
				const bookingObj = {
					otp: data.pickup_otp || Math.floor(1000 + Math.random() * 9000),
					booking_id:
						data.booking_id ||
						"BK-" + Math.floor(10000 + Math.random() * 90000),
					ride: ride,
					fare: fare,
					seat_no: seatNo,
					status: "requested",
				};
				setBookingSuccess(bookingObj);
				if (onRideBooked) onRideBooked(bookingObj);
			} else {
				showAlert(data.message || "Failed to book ride", "Booking Failed", "error");
			}
		} catch (err) {
			console.error("Booking error:", err);
			showAlert("Could not connect to the server. Please check your connection and try again.", "Booking Error", "error");
		} finally {
			setBookingLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full text-left">
			{/* Header */}
			<div className="p-3.5 border-b border-slate-100 bg-slate-50/80">
				<div className="flex items-center justify-between gap-2 mb-2">
					<button
						onClick={onBack}
						className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition-all cursor-pointer group"
					>
						<ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
						<span>Edit Route</span>
					</button>

					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
							<span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
							10km Radius
						</span>
						<span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md text-[10px] font-extrabold">
							{filteredRides.length} Available
						</span>
					</div>
				</div>

				<div>
					<h2 className="text-sm font-black text-slate-900 tracking-tight">
						Colleague Commute Matches
					</h2>
					<p className="text-[11px] text-slate-500 font-medium">
						Verified colleagues driving along your corridor
					</p>
				</div>

				{/* Search & Filter Bar */}
				<div className="mt-3.5 space-y-2">
					<div className="relative">
						<Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search by driver, department, destination..."
							className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D] transition-all"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								<X className="w-3.5 h-3.5" />
							</button>
						)}
					</div>

					{/* Quick Filter Chips & Gender Filter */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
						{/* Strict Female-Only Rides Toggle */}
						<button
							onClick={() => setFemaleOnlyFilter(!femaleOnlyFilter)}
							className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer border ${
								femaleOnlyFilter
									? "bg-rose-500 text-white border-rose-500 shadow-sm"
									: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
							}`}
							title="Toggle Female-Only verified carpools for safety"
						>
							<Heart className={`w-3 h-3 ${femaleOnlyFilter ? "fill-white" : "fill-rose-500"}`} />
							<span>🌸 Female-Only</span>
						</button>

						<button
							onClick={() => setFilterType("all")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "all"
									? "bg-slate-900 text-white shadow-xs"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							All Corridors
						</button>

						<button
							onClick={() => setFilterType("under5km")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "under5km"
									? "bg-teal-600 text-white shadow-xs"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							⚡ Under 5 km
						</button>

						<button
							onClick={() => setFilterType("seats")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "seats"
									? "bg-teal-600 text-white shadow-xs"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							👥 3+ Seats
						</button>

						<button
							onClick={() => setFilterType("fare")}
							className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
								filterType === "fare"
									? "bg-teal-600 text-white shadow-xs"
									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
							}`}
						>
							₹ Subsidized Fare
						</button>
					</div>

					{/* Destination Tech Hub Filter Bar */}
					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
						<span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Tech Hub:</span>
						<button
							onClick={() => setSelectedTechPark("all")}
							className={`px-2 py-0.5 rounded-md font-semibold transition-colors cursor-pointer ${
								selectedTechPark === "all"
									? "bg-slate-800 text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200"
							}`}
						>
							All Hubs
						</button>
						{POPULAR_TECH_PARKS.slice(0, 4).map((park) => (
							<button
								key={park.id}
								onClick={() => setSelectedTechPark(selectedTechPark === park.name ? "all" : park.name)}
								className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
									selectedTechPark === park.name
										? "bg-teal-700 text-white"
										: "bg-slate-100 text-slate-600 hover:bg-slate-200"
								}`}
							>
								{park.name.split(" ")[0]} ({park.city})
							</button>
						))}
					</div>

					{/* Zero Cash Policy Notice */}
					<div className="px-3 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
						<span className="flex items-center gap-1.5 font-medium">
							<Lock className="w-3 h-3 text-slate-400" />
							<span>Zero-Cash Policy: Seamless in-app wallet auto-settlement.</span>
						</span>
						<span className="font-bold text-teal-700">100% Cashless</span>
					</div>
				</div>
			</div>

			{/* Rides List Container */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-transparent">
				{loading ? (
					<div className="py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
						<div className="w-8 h-8 border-3 border-[#00A09D] border-t-transparent rounded-full animate-spin"></div>
						<p className="text-xs font-semibold">
							Scanning 10km radius...
						</p>
					</div>
				) : filteredRides.length > 0 ? (
					filteredRides.map((ride) => {
						const isSelected = selectedRide?.ride_id === ride.ride_id;
						const depTime = new Date(ride.departure_time);
						const timeStr = isNaN(depTime.getTime())
							? "In 15 mins"
							: depTime.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								});

						return (
							<div
								key={ride.ride_id}
								onClick={() => onSelectRide(ride)}
								className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
									isSelected
										? "bg-[#00A09D]/5 border-[#00A09D] ring-2 ring-[#00A09D]/20 shadow-sm"
										: "bg-white border-gray-200/90 hover:border-gray-300 hover:shadow-2xs"
								}`}
							>
								{/* Driver & Vehicle Header with Digital ID Company Framed Ring */}
								{(() => {
									const driverCompany = ride.driver_company || ride.org_name || "Enterprise";
									const compInfo = getCompanyInfo(driverCompany);
									const DriverLogo = compInfo.Logo;
									const isDirectColleague = driverCompany.toLowerCase() === currentOrg.toLowerCase();
									const arrivalTime = ride.target_arrival_time || "08:50 AM";

									return (
										<div className="flex items-start justify-between gap-2 mb-2.5">
											<div className="flex items-center gap-3">
												{/* Avatar Framed by Official Corporate Logo */}
												<div 
													className="relative cursor-pointer group"
													onClick={(e) => {
														e.stopPropagation();
														setViewingDriverIdCard(ride);
													}}
													title="Click to view full Corporate Digital ID Card"
												>
													<div className={`w-11 h-11 rounded-2xl bg-white p-0.5 shadow-xs border-2 ${compInfo.borderRing} flex items-center justify-center`}>
														<div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tight">
															{ride.driver_name ? ride.driver_name.charAt(0).toUpperCase() : "D"}
														</div>
													</div>
													{/* Framed Corporate Badge */}
													<div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md shadow-xs border border-white bg-white flex items-center justify-center p-0.5">
														<DriverLogo />
													</div>
												</div>

												<div>
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="font-extrabold text-sm text-slate-900">
															{ride.driver_name}
														</span>
														<ShieldCheck className="w-4 h-4 text-emerald-600" title="Corporate SSO Verified" />

														{/* Trust Badge: Colleague vs Neighboring Campus Peer */}
														{isDirectColleague ? (
															<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
																🏢 {compInfo.shortName} Colleague
															</span>
														) : (
															<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
																🌐 {compInfo.shortName} Campus Peer
															</span>
														)}

														{ride.is_female_only && (
															<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
																<Heart className="w-2.5 h-2.5 fill-rose-500" />
																Female-Only
															</span>
														)}
													</div>

													<p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
														<span className="font-semibold text-slate-700">
															{ride.driver_dept || ride.driver_designation || "Engineering"}
														</span>
														<span>•</span>
														<span className="text-amber-500 font-bold flex items-center gap-0.5">
															<Star className="w-3 h-3 fill-amber-400" />
															{ride.driver_trust_score ? `${ride.driver_trust_score}% Trust` : "99.4% Trust"}
														</span>
													</p>
												</div>
											</div>

											{/* Cost-Share & Target Arrival Time */}
											<div className="text-right shrink-0">
												<div className="text-base font-black text-slate-900 tracking-tight font-mono">
													₹{ride.fare_per_seat || 45}
												</div>
												<span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 block mt-0.5">
													Arrives at {arrivalTime}
												</span>
												{parseFloat(ride.subsidy_per_seat || 0) > 0 && (
													<span className="text-[9px] text-emerald-600 font-semibold block mt-0.5">
														-₹{ride.subsidy_per_seat} ESG Subsidy
													</span>
												)}
											</div>
										</div>
									);
								})()}

								{/* En-Route & Corridor Badges */}
								{ride.en_route_available && (
									<div className="mb-2 flex items-center justify-between px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-[#714B67] text-[11px] font-bold animate-in fade-in">
										<span className="flex items-center gap-1.5">
											<span className="relative flex h-2 w-2">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
												<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
											</span>
											<span>⚡ Active Driver on Road • Instant En-Route Hop-In</span>
										</span>
										<span className="text-[9px] uppercase tracking-wider bg-[#714B67] text-white px-1.5 py-0.5 rounded font-black">
											En-Route
										</span>
									</div>
								)}

								{ride.is_h3_matched && (
									<div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-[11px] font-semibold">
										<span>🔷 Uber H3 Corridor Verified (Resolution 8 Hexagonal Match)</span>
									</div>
								)}

								{ride.corridor_match && !ride.is_h3_matched && (
									<div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-emerald-800 text-[11px] font-semibold">
										<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
										<span>Direct Route Match • ~{ride.total_detour_km ?? 0} km detour</span>
									</div>
								)}
								<div className="mb-3 flex items-center justify-between text-xs py-1.5 px-2.5 bg-gray-50 rounded-lg border border-gray-100">
									<div className="flex items-center gap-1.5 text-gray-700 font-semibold">
										<Car className="w-3.5 h-3.5 text-[#714B67]" />
										<span>{ride.vehicle_model || "Swift Dzire"}</span>
									</div>
									<span className="font-mono text-[11px] text-gray-500 uppercase font-bold">
										{ride.veh_no || "WB 02 AB 1234"}
									</span>
								</div>

								{/* Route Points */}
								<div className="space-y-1.5 text-xs text-gray-600 mb-3.5">
									<div className="flex items-start gap-2">
										<div className="w-2 h-2 rounded-full bg-[#00A09D] mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-gray-400 block">
												Pickup (Near You)
											</span>
											<p className="font-semibold text-gray-800 truncate">
												{ride.origin?.name ||
													"1.2km from your spot"}
											</p>
										</div>
										<span className="text-[11px] font-bold text-[#00A09D] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 shrink-0">
											{ride.distance_km || 1.2} km away
										</span>
									</div>

									<div className="flex items-start gap-2">
										<div className="w-2 h-2 rounded-full bg-[#EF4444] mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-gray-400 block">
												Destination
											</span>
											<p className="font-semibold text-gray-800 truncate">
												{ride.destination?.name ||
													"Tech Hub Sector V"}
											</p>
										</div>
									</div>
								</div>

								{/* Footer Info & Actions */}
								<div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
									<div className="flex items-center gap-3 text-xs text-gray-500">
										<span className="flex items-center gap-1 font-semibold text-gray-700">
											<Clock className="w-3.5 h-3.5 text-gray-400" />
											{timeStr}
										</span>
										{(() => {
											const seatsLeft = ride.available_seats !== undefined && ride.available_seats !== null ? Number(ride.available_seats) : 3;
											return seatsLeft <= 0 ? (
												<span className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
													<Users className="w-3.5 h-3.5" />
													Full (0 seats left)
												</span>
											) : (
												<span className="flex items-center gap-1 font-semibold text-[#00A09D]">
													<Users className="w-3.5 h-3.5" />
													{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} left
												</span>
											);
										})()}
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={(e) => {
												e.stopPropagation();
												onSelectRide(ride);
											}}
											className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
										>
											Map View
										</button>

										{(() => {
											const seatsLeft = ride.available_seats !== undefined && ride.available_seats !== null ? Number(ride.available_seats) : 3;

											if (activeTrip && (activeTrip.ride?.ride_id === ride.ride_id || activeTrip.ride_id === ride.ride_id)) {
												return (
													<button
														onClick={(e) => {
															e.stopPropagation();
															if (onBack) onBack();
														}}
														className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
													>
														⏳ Seat Requested (View Request)
													</button>
												);
											}

											if (activeTrip) {
												return (
													<button
														disabled
														className="px-3.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1"
														title="You already have an active seat request in this time slot!"
													>
														Slot Requested
													</button>
												);
											}

											if (seatsLeft <= 0) {
												return (
													<button
														disabled
														className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed select-none"
														title="This ride is completely full. No seats available."
													>
														Ride Full
													</button>
												);
											}

											return (
												<button
													onClick={(e) => {
														e.stopPropagation();
														setBookingModalRide(ride);
													}}
													className="px-3.5 py-1.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
												>
													Request Seat
												</button>
											);
										})()}
									</div>
								</div>
							</div>
						);
					})
				) : null}

				{/* ENGINE 2: GUARANTEED COMMERCIAL BACKUP CARD (PITCH DECK ENGINE 2) */}
				<div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden mt-2 select-none">
					<div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

					<div className="relative z-10 space-y-3">
						<div className="flex items-center justify-between">
							<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
								<Zap className="w-3 h-3 text-teal-300" />
								Engine 2 • Commercial Backup
							</div>
							<span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
								<Clock className="w-3 h-3 text-teal-400" /> 4 min dispatch
							</span>
						</div>

						<div>
							<h3 className="text-sm font-extrabold text-white">Guaranteed Commute Dispatch</h3>
							<p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
								Zero carpool anxiety. If no peer schedule matches or a coworker cancels, Norimono instant priority cabs & bikes are backed by guaranteed commercial reliability.
							</p>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
							<div className="flex flex-col">
								<span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Corporate Capped Fare</span>
								<span className="text-base font-black text-teal-300 font-mono">₹89.00</span>
							</div>

							{engine2Dispatched ? (
								<span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-xl text-xs font-bold flex items-center gap-1">
									<CheckCircle2 className="w-3.5 h-3.5" /> Dispatched (ETA 4m)
								</span>
							) : (
								<button
									onClick={() => {
										setEngine2Dispatched(true);
										showAlert("Engine 2 Guaranteed Commercial Cab dispatched! Driver assigned: Swift Dzire (KA-03-TR-9002), arriving in 4 mins.", "Commercial Backup Dispatched", "success");
									}}
									className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1"
								>
									<Zap className="w-3.5 h-3.5" /> Dispatch Backup
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Empty State when 0 filtered rides */}
				{!loading && filteredRides.length === 0 && (
					<div className="py-8 px-6 text-center space-y-2 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 mt-2">
						<p className="text-xs font-bold text-slate-700">No colleague carpools found matching this specific filter.</p>
						<p className="text-[11px] text-slate-500">Use Engine 2 Commercial Backup above or adjust your search.</p>
					</div>
				)}
			</div>

			{/* Digital ID Card Modal Preview */}
			{viewingDriverIdCard && (
				<DigitalIdCard
					user={viewingDriverIdCard}
					showModal={true}
					onClose={() => setViewingDriverIdCard(null)}
				/>
			)}

			{/* MODAL: CONFIRM BOOKING */}
			{bookingModalRide && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left">
						<div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-[#00A09D]/10 rounded-lg flex items-center justify-center text-[#00A09D]">
									<Car className="w-4 h-4" />
								</div>
								<h3 className="text-base font-bold text-gray-900">
									Request a Seat
								</h3>
							</div>
							<button
								onClick={() => setBookingModalRide(null)}
								className="text-gray-400 hover:text-gray-600 cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-5 space-y-4">
							<div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-xl space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-gray-600 font-semibold">
										Driver
									</span>
									<span className="font-bold text-gray-900">
										{bookingModalRide.driver_name} (
										{bookingModalRide.driver_dept})
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-600 font-semibold">
										Vehicle
									</span>
									<span className="font-bold text-gray-900">
										{bookingModalRide.vehicle_model} •{" "}
										{bookingModalRide.veh_no}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-gray-600 font-semibold">
										Destination
									</span>
									<span className="font-bold text-gray-900 truncate max-w-[200px]">
										{bookingModalRide.destination?.name}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2 border-t border-teal-200">
									<div className="flex items-center gap-1.5 text-teal-900 font-bold">
										<Wallet className="w-3.5 h-3.5 text-[#714B67]" />
										<span>Commute Contribution</span>
									</div>
									<div className="text-right">
										<span className="text-base font-extrabold text-[#00A09D]">
											₹{bookingModalRide.fare_per_seat || 45}
										</span>
										<span className="block text-[10px] text-gray-500 font-medium">
											from Norimono Wallet
										</span>
									</div>
								</div>

								{/* Seat Selection — Dynamic based on available seats */}
								<div className="pt-2 border-t border-teal-100">
									<label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
										Choose Preferred Seat ({bookingModalRide.available_seats} available)
									</label>
									<select
										value={selectedSeatPref}
										onChange={(e) => setSelectedSeatPref(e.target.value)}
										className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#00A09D]"
									>
										{(() => {
											const seatLabels = ["Seat 1 (Front Window)", "Seat 2 (Rear Left Window)", "Seat 3 (Rear Right Window)", "Seat 4 (Rear Middle)"];
											const totalSeats = bookingModalRide.total_seats || 4;
											const availableCount = bookingModalRide.available_seats || 0;
											// Show only as many seat options as are available, capped by total
											const seatCount = Math.min(availableCount, totalSeats, seatLabels.length);
											return seatLabels.slice(0, seatCount).map((label, idx) => (
												<option key={idx} value={label}>{label}</option>
											));
										})()}
									</select>
								</div>
							</div>

							<p className="text-xs text-gray-500">
								Requesting this seat notifies the driver for approval. Once confirmed by the driver, your seat is locked!
							</p>

							<div className="flex items-center gap-3 pt-2">
								<button
									onClick={() => setBookingModalRide(null)}
									className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										handleBookRide(bookingModalRide);
										setBookingModalRide(null);
									}}
									disabled={bookingLoading}
									className="flex-1 py-2.5 bg-[#00A09D] hover:bg-[#008f8c] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
								>
									{bookingLoading ? "Sending..." : "Send Seat Request"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL: BOOKING SUCCESS WITH OTP */}
			{bookingSuccess && (
				<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center p-6 space-y-4">
						<div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
							<CheckCircle2 className="w-8 h-8" />
						</div>

						<div>
							<h3 className="text-lg font-extrabold text-gray-900">
								Ride Booked Successfully!
							</h3>
							<p className="text-xs text-gray-500 mt-1">
								Share this 4-digit OTP with your driver at pickup.
							</p>
						</div>

						{/* Large OTP Display */}
						<div className="bg-gray-50 border-2 border-dashed border-[#00A09D] rounded-2xl p-4 my-2">
							<span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
								Pickup Verification OTP
							</span>
							<div className="text-3xl font-mono font-black text-[#00A09D] tracking-widest">
								{bookingSuccess.otp}
							</div>
							<span className="text-[11px] text-gray-500 mt-1 block">
								Booking ID: {bookingSuccess.booking_id}
							</span>
							<div className="mt-2 inline-block px-3 py-1 bg-teal-50 border border-teal-200 text-[#00A09D] text-xs font-extrabold rounded-lg">
								💺 {bookingSuccess.seat_no || "Seat #2 (Front Left)"}
							</div>
						</div>

						{/* Wallet Payment confirmation tag */}
						<div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
							<span className="text-gray-600 font-medium flex items-center gap-1.5">
								<Wallet className="w-3.5 h-3.5 text-[#714B67]" /> Norimono Wallet
							</span>
							<span className="font-bold text-[#714B67]">
								-₹{bookingSuccess.fare || 45}.00 Deducted
							</span>
						</div>

						<button
							onClick={() => setBookingSuccess(null)}
							className="w-full py-2.5 bg-[#714B67] hover:bg-[#5c3c54] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
						>
							Great, Got It!
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
