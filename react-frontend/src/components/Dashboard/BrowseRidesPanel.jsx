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
	Award,
	Wind,
	MessageSquare,
	Briefcase,
	Repeat
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
	const [passengerLuggage, setPassengerLuggage] = useState("medium");
	const [passengerNotes, setPassengerNotes] = useState("");
	const [selectedStopover, setSelectedStopover] = useState("");
	const [bookingLoading, setBookingLoading] = useState(false);
	const [bookingSuccess, setBookingSuccess] = useState(null); // { otp, booking_id }

	// BlaBlaCar Quick Filters
	const [acOnlyFilter, setAcOnlyFilter] = useState(false);
	const [instantBookingFilter, setInstantBookingFilter] = useState(false);
	const [maxTwoBackFilter, setMaxTwoBackFilter] = useState(false);

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

			// 4. BlaBlaCar Quick Filters
			if (acOnlyFilter && ride.preferences && ride.preferences.ac === false) return false;
			if (instantBookingFilter && ride.instant_booking === false) return false;
			if (maxTwoBackFilter && ride.preferences && ride.preferences.max_two_back === false) return false;

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
					pickup_location: selectedStopover ? { name: selectedStopover, is_stopover: true } : ride.origin,
					dropoff_location: ride.destination,
					luggage_size: passengerLuggage,
					passenger_notes: passengerNotes.trim() || undefined,
					selected_stopover: selectedStopover || undefined
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
			{/* Ultra-Minimal Results Header */}
			<div className="px-4 py-3 bg-white border-b border-neutral-100 flex items-center justify-between shrink-0 shadow-xs">
				<button
					onClick={onBack}
					className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-black bg-white hover:bg-neutral-50 border-2 border-neutral-200 hover:border-black rounded-xl transition-all cursor-pointer shadow-[0_2px_0_rgba(0,0,0,0.06)] active:translate-y-0.5 active:shadow-none group"
				>
					<ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform stroke-[2.5]" />
					<span>Edit Route</span>
				</button>

				<div className="flex items-center gap-2">
					{/* Female-Only Toggle */}
					<button
						onClick={() => setFemaleOnlyFilter(!femaleOnlyFilter)}
						className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer border-2 ${
							femaleOnlyFilter
								? "bg-rose-500 text-white border-rose-600 shadow-[0_2px_0_#be123c] active:translate-y-0.5 active:shadow-none"
								: "bg-white text-rose-700 hover:bg-rose-50 border-rose-200 shadow-[0_2px_0_rgba(0,0,0,0.04)]"
						}`}
						title="Toggle Female-Only carpools"
					>
						<Heart className={`w-3 h-3 ${femaleOnlyFilter ? "fill-white" : "fill-rose-500"}`} />
						<span>Female-Only</span>
					</button>

					{/* Small Results Count Pill in Obsidian Black with Yellow Text */}
					<span className="px-3 py-1.5 bg-black text-yellow-400 border border-neutral-800 rounded-xl text-xs font-black shadow-[0_2px_0_#262626] tracking-tight">
						{filteredRides.length} {filteredRides.length === 1 ? "ride" : "rides"}
					</span>
				</div>
			</div>

			{/* Rides List Container - Directly shows results */}
			<div className="flex-1 overflow-y-auto p-3.5 space-y-3">
				{loading ? (
					<div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-2">
						<div className="w-8 h-8 border-3 border-yellow-400 border-t-black rounded-full animate-spin"></div>
						<p className="text-xs font-bold text-neutral-600">
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
								className={`p-4 rounded-2xl border-2 transition-all duration-150 cursor-pointer text-left ${
									isSelected
										? "bg-yellow-50/40 border-yellow-400 ring-2 ring-yellow-400/40 shadow-[0_8px_24px_rgba(250,204,21,0.2)]"
										: "bg-white border-neutral-200/90 hover:border-yellow-400 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] shadow-[0_3px_0_rgba(0,0,0,0.04)]"
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
													<div className="w-11 h-11 rounded-2xl bg-black p-0.5 shadow-md flex items-center justify-center">
														<div className="w-full h-full rounded-xl bg-black text-yellow-400 flex items-center justify-center font-black text-sm tracking-tight border border-white/20">
															{ride.driver_name ? ride.driver_name.charAt(0).toUpperCase() : "D"}
														</div>
													</div>
													{/* Framed Corporate Badge */}
													<div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-md shadow-xs border border-black bg-white flex items-center justify-center p-0.5">
														<DriverLogo />
													</div>
												</div>

												<div>
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="font-black text-sm text-black">
															{ride.driver_name}
														</span>
														<ShieldCheck className="w-4 h-4 text-amber-600" title="Corporate SSO Verified" />

														{/* Trust Badge: Colleague vs Neighboring Campus Peer */}
														{isDirectColleague ? (
															<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300">
																🏢 {compInfo.shortName} Colleague
															</span>
														) : (
															<span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
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

													<p className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
														<span className="font-bold text-neutral-700">
															{ride.driver_dept || ride.driver_designation || "Engineering"}
														</span>
														<span>•</span>
														<span className="text-amber-600 font-black flex items-center gap-0.5">
															<Star className="w-3 h-3 fill-amber-400 text-amber-500" />
															{ride.driver_trust_score ? `${ride.driver_trust_score}% Trust` : "99.4% Trust"}
														</span>
													</p>
												</div>
											</div>

											{/* Cost-Share & Target Arrival Time */}
											<div className="text-right shrink-0">
												<div className="inline-block px-2.5 py-1 bg-yellow-400 text-black font-black text-sm font-mono rounded-xl shadow-[0_2px_0_#CA8A04]">
													₹{ride.fare_per_seat || 45}
												</div>
												<span className="text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 block mt-1">
													Arrives at {arrivalTime}
												</span>
												{parseFloat(ride.subsidy_per_seat || 0) > 0 && (
													<span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
														-₹{ride.subsidy_per_seat} ESG Subsidy
													</span>
												)}
											</div>
										</div>
									);
								})()}

								{/* En-Route & Corridor Badges */}
								{ride.en_route_available && (
									<div className="mb-2 flex items-center justify-between px-2.5 py-1 bg-yellow-50 border border-yellow-200 rounded-xl text-black text-[11px] font-bold">
										<span className="flex items-center gap-1.5">
											<span className="relative flex h-2 w-2">
												<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
												<span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
											</span>
											<span>⚡ Active Driver on Road • Instant En-Route Hop-In</span>
										</span>
										<span className="text-[9px] uppercase tracking-wider bg-black text-yellow-400 px-1.5 py-0.5 rounded font-black">
											En-Route
										</span>
									</div>
								)}

								{ride.is_h3_matched && (
									<div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-xl text-black text-[11px] font-bold">
										<span>🔷 Uber H3 Corridor Verified (Resolution 8 Hexagonal Match)</span>
									</div>
								)}

								{ride.corridor_match && !ride.is_h3_matched && (
									<div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-xl text-black text-[11px] font-bold">
										<CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
										<span>Direct Route Match • ~{ride.total_detour_km ?? 0} km detour</span>
									</div>
								)}
								<div className="mb-2 flex items-center justify-between text-xs py-1.5 px-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80">
									<div className="flex items-center gap-1.5 text-black font-bold">
										<Car className="w-3.5 h-3.5 text-neutral-700" />
										<span>{ride.vehicle_model || "Swift Dzire"}</span>
									</div>
									<span className="font-mono text-[11px] text-neutral-600 uppercase font-black">
										{ride.veh_no || "WB 02 AB 1234"}
									</span>
								</div>

								{/* BlaBlaCar Commute Amenities & Chattiness Badges */}
								<div className="flex items-center gap-1 flex-wrap mb-2.5">
									{ride.preferences?.chattiness && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-black border border-neutral-200 flex items-center gap-1">
											<MessageSquare className="w-2.5 h-2.5 text-neutral-600" />
											{ride.preferences.chattiness === "bla" ? "Bla (Quiet)" : ride.preferences.chattiness === "blablabla" ? "BlaBlaBla (Chatty)" : "BlaBla"}
										</span>
									)}
									{ride.instant_booking !== false && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-100 text-amber-900 border border-yellow-300 flex items-center gap-0.5">
											<Zap className="w-2.5 h-2.5 text-amber-600 fill-amber-500" /> Instant
										</span>
									)}
									{ride.preferences?.ac !== false && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center gap-1">
											<Wind className="w-2.5 h-2.5 text-neutral-600" /> AC
										</span>
									)}
									{ride.preferences?.max_two_back !== false && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center gap-1">
											<Users className="w-2.5 h-2.5 text-neutral-600" /> Max 2 in Back
										</span>
									)}
									{ride.preferences?.smoking === false && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
											🚭 No Smoking
										</span>
									)}
									{ride.is_recurring && (
										<span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center gap-1">
											<Repeat className="w-2.5 h-2.5 text-neutral-600" /> Mon-Fri
										</span>
									)}
								</div>

								{/* Intermediate Stopovers if available */}
								{Array.isArray(ride.stopovers) && ride.stopovers.length > 0 && (
									<div className="mb-2.5 px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] text-neutral-700 flex items-center gap-1.5 flex-wrap">
										<span className="font-black text-black uppercase">Via Stops:</span>
										{ride.stopovers.map((s, idx) => (
											<span key={idx} className="bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 font-bold text-black">
												📍 {s}
											</span>
										))}
									</div>
								)}

								{/* Route Points */}
								<div className="space-y-1.5 text-xs text-neutral-600 mb-3.5">
									<div className="flex items-start gap-2">
										<div className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-200 mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-neutral-400 block">
												Pickup (Near You)
											</span>
											<p className="font-bold text-black truncate">
												{ride.origin?.name ||
													"1.2km from your spot"}
											</p>
										</div>
										<span className="text-[11px] font-black text-black bg-yellow-100 px-2 py-0.5 rounded-md border border-yellow-300 shrink-0">
											{ride.distance_km || 1.2} km away
										</span>
									</div>

									<div className="flex items-start gap-2">
										<div className="w-2.5 h-2.5 rounded-full bg-black ring-2 ring-neutral-200 mt-1 shrink-0"></div>
										<div className="flex-1 min-w-0">
											<span className="text-[10px] uppercase font-bold text-neutral-400 block">
												Destination
											</span>
											<p className="font-bold text-black truncate">
												{ride.destination?.name ||
													"Tech Hub Sector V"}
											</p>
										</div>
									</div>
								</div>

								{/* Footer Info & Actions */}
								<div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
									<div className="flex items-center gap-3 text-xs text-neutral-500">
										<span className="flex items-center gap-1 font-bold text-black">
											<Clock className="w-3.5 h-3.5 text-neutral-500" />
											{timeStr}
										</span>
										{(() => {
											const seatsLeft = ride.available_seats !== undefined && ride.available_seats !== null ? Number(ride.available_seats) : 3;
											return seatsLeft <= 0 ? (
												<span className="flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
													<Users className="w-3.5 h-3.5" />
													Full (0 seats left)
												</span>
											) : (
												<span className="flex items-center gap-1 font-bold text-black">
													<Users className="w-3.5 h-3.5 text-amber-600" />
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
											className="px-2.5 py-1.5 text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
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
														className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl shadow-[0_3px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
													>
														⏳ Seat Requested (View Request)
													</button>
												);
											}

											if (activeTrip) {
												return (
													<button
														disabled
														className="px-3.5 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center gap-1"
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
														className="px-3.5 py-1.5 bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-bold rounded-xl cursor-not-allowed select-none"
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
													className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl shadow-[0_3px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
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
				<div className="bg-black text-white rounded-3xl p-5 border border-neutral-800 shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative overflow-hidden mt-2 select-none">
					<div className="absolute top-0 right-0 w-44 h-44 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />

					<div className="relative z-10 space-y-3">
						<div className="flex items-center justify-between">
							<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-400 text-black">
								<Zap className="w-3 h-3 text-black fill-black" />
								Engine 2 • Commercial Backup
							</div>
							<span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1">
								<Clock className="w-3 h-3 text-yellow-400" /> 4 min dispatch
							</span>
						</div>

						<div>
							<h3 className="text-sm font-black text-white">Guaranteed Commute Dispatch</h3>
							<p className="text-[11px] text-neutral-300 leading-relaxed mt-0.5">
								Zero carpool anxiety. If no peer schedule matches or a coworker cancels, Norimono instant priority cabs & bikes are backed by guaranteed commercial reliability.
							</p>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-neutral-800">
							<div className="flex flex-col">
								<span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Corporate Capped Fare</span>
								<span className="text-base font-black text-yellow-400 font-mono">₹89.00</span>
							</div>

							{engine2Dispatched ? (
								<span className="px-3 py-1.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 rounded-xl text-xs font-bold flex items-center gap-1">
									<CheckCircle2 className="w-3.5 h-3.5" /> Dispatched (ETA 4m)
								</span>
							) : (
								<button
									onClick={() => {
										setEngine2Dispatched(true);
										showAlert("Engine 2 Guaranteed Commercial Cab dispatched! Driver assigned: Swift Dzire (KA-03-TR-9002), arriving in 4 mins.", "Commercial Backup Dispatched", "success");
									}}
									className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl shadow-[0_3px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1"
								>
									<Zap className="w-3.5 h-3.5 fill-black" /> Dispatch Backup
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Empty State when 0 filtered rides */}
				{!loading && filteredRides.length === 0 && (
					<div className="py-8 px-6 text-center space-y-2 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 mt-2">
						<p className="text-xs font-black text-black">No colleague carpools found matching this specific filter.</p>
						<p className="text-[11px] text-neutral-500 font-medium">Use Engine 2 Commercial Backup above or adjust your search.</p>
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
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left border border-neutral-200">
						<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>
						<div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-black shadow-xs font-bold">
									<Car className="w-4 h-4 stroke-[2.5]" />
								</div>
								<h3 className="text-base font-black text-black">
									Request a Seat
								</h3>
							</div>
							<button
								onClick={() => setBookingModalRide(null)}
								className="text-neutral-400 hover:text-black cursor-pointer"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-5 space-y-4">
							<div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2 text-xs">
								<div className="flex justify-between items-center">
									<span className="text-neutral-500 font-bold">
										Driver
									</span>
									<span className="font-black text-black">
										{bookingModalRide.driver_name} (
										{bookingModalRide.driver_dept})
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-neutral-500 font-bold">
										Vehicle
									</span>
									<span className="font-black text-black font-mono">
										{bookingModalRide.vehicle_model} •{" "}
										{bookingModalRide.veh_no}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-neutral-500 font-bold">
										Destination
									</span>
									<span className="font-black text-black truncate max-w-[200px]">
										{bookingModalRide.destination?.name}
									</span>
								</div>
								<div className="flex justify-between items-center pt-2 border-t border-neutral-200">
									<div className="flex items-center gap-1.5 text-black font-black">
										<Wallet className="w-3.5 h-3.5 text-amber-600" />
										<span>Commute Contribution</span>
									</div>
									<div className="text-right">
										<span className="text-base font-black text-black font-mono">
											₹{bookingModalRide.fare_per_seat || 45}
										</span>
										<span className="block text-[10px] text-neutral-500 font-medium">
											from Norimono Wallet
										</span>
									</div>
								</div>

								{/* Seat Selection */}
								<div className="pt-2 border-t border-neutral-200">
									<label className="block text-xs font-black text-neutral-700 uppercase tracking-wider mb-1.5">
										Choose Preferred Seat ({bookingModalRide.available_seats} available)
									</label>
									<select
										value={selectedSeatPref}
										onChange={(e) => setSelectedSeatPref(e.target.value)}
										className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
									>
										{(() => {
											const seatLabels = ["Seat 1 (Front Window)", "Seat 2 (Rear Left Window)", "Seat 3 (Rear Right Window)", "Seat 4 (Rear Middle)"];
											const totalSeats = bookingModalRide.total_seats || 4;
											const availableCount = bookingModalRide.available_seats || 0;
											const seatCount = Math.min(availableCount, totalSeats, seatLabels.length);
											return seatLabels.slice(0, seatCount).map((label, idx) => (
												<option key={idx} value={label}>{label}</option>
											));
										})()}
									</select>
								</div>

								{/* Stopovers */}
								{Array.isArray(bookingModalRide.stopovers) && bookingModalRide.stopovers.length > 0 && (
									<div className="pt-2 border-t border-neutral-200">
										<label className="block text-xs font-black text-neutral-700 uppercase tracking-wider mb-1.5">
											Select Pickup Spot along Corridor
										</label>
										<select
											value={selectedStopover}
											onChange={(e) => setSelectedStopover(e.target.value)}
											className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
										>
											<option value="">Default: Driver's Origin ({bookingModalRide.origin?.name || "Pickup Spot"})</option>
											{bookingModalRide.stopovers.map((s, idx) => (
												<option key={idx} value={s}>📍 En-route: {s}</option>
											))}
										</select>
									</div>
								)}

								{/* Luggage Size */}
								<div className="pt-2 border-t border-neutral-200">
									<label className="block text-xs font-black text-neutral-700 uppercase tracking-wider mb-1.5">
										Your Luggage Size
									</label>
									<div className="grid grid-cols-3 gap-1.5">
										{[
											{ id: "small", label: "🎒 Backpack" },
											{ id: "medium", label: "🧳 Cabin Bag" },
											{ id: "large", label: "📦 Trunk Bag" }
										].map((lug) => (
											<button
												key={lug.id}
												type="button"
												onClick={() => setPassengerLuggage(lug.id)}
												className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
													passengerLuggage === lug.id
														? "bg-yellow-400 text-black border-yellow-500 shadow-[0_2px_0_#CA8A04]"
														: "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50"
												}`}
											>
												{lug.label}
											</button>
										))}
									</div>
								</div>

								{/* Pickup Note */}
								<div className="pt-2 border-t border-neutral-200">
									<label className="block text-xs font-black text-neutral-700 uppercase tracking-wider mb-1.5">
										Note for Colleague (Optional)
									</label>
									<input
										type="text"
										value={passengerNotes}
										onChange={(e) => setPassengerNotes(e.target.value)}
										placeholder="e.g. Waiting at Gate 1 main lobby"
										className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-black font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400"
									/>
								</div>
							</div>

							{bookingModalRide.instant_booking !== false ? (
								<div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-200 text-amber-900 text-xs flex items-center gap-2">
									<Zap className="w-4 h-4 text-amber-600 shrink-0 fill-amber-500" />
									<p className="text-[11px] font-bold leading-tight">
										<strong>Instant Booking Enabled:</strong> Your seat is confirmed immediately!
									</p>
								</div>
							) : (
								<p className="text-xs text-neutral-500 font-medium">
									Requesting this seat notifies the driver for approval. Once confirmed by the driver, your seat is locked!
								</p>
							)}

							<div className="flex items-center gap-3 pt-2">
								<button
									onClick={() => setBookingModalRide(null)}
									className="flex-1 py-3 border-2 border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={() => {
										handleBookRide(bookingModalRide);
										setBookingModalRide(null);
									}}
									disabled={bookingLoading}
									className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl shadow-[0_3px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
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
				<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center p-6 space-y-4 border border-neutral-200">
						<div className="w-14 h-14 bg-yellow-400 text-black rounded-2xl flex items-center justify-center mx-auto shadow-md">
							<CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
						</div>

						<div>
							<h3 className="text-lg font-black text-black">
								Ride Booked Successfully!
							</h3>
							<p className="text-xs text-neutral-500 mt-1 font-medium">
								Share this 4-digit OTP with your driver at pickup.
							</p>
						</div>

						{/* Large OTP Display */}
						<div className="bg-neutral-50 border-2 border-dashed border-yellow-400 rounded-2xl p-4 my-2">
							<span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">
								Pickup Verification OTP
							</span>
							<div className="text-4xl font-mono font-black text-black tracking-widest">
								{bookingSuccess.otp}
							</div>
							<span className="text-[11px] text-neutral-500 mt-1 block font-mono">
								Booking ID: {bookingSuccess.booking_id}
							</span>
							<div className="mt-2 inline-block px-3 py-1 bg-yellow-100 border border-yellow-300 text-black text-xs font-black rounded-lg">
								💺 {bookingSuccess.seat_no || "Seat #2 (Front Left)"}
							</div>
						</div>

						{/* Wallet Payment confirmation tag */}
						<div className="p-2.5 bg-neutral-100 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
							<span className="text-neutral-700 font-bold flex items-center gap-1.5">
								<Wallet className="w-3.5 h-3.5 text-amber-600" /> Norimono Wallet
							</span>
							<span className="font-black text-black">
								-₹{bookingSuccess.fare || 45}.00 Deducted
							</span>
						</div>

						<button
							onClick={() => setBookingSuccess(null)}
							className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-xl shadow-[0_3px_0_#CA8A04] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
						>
							Great, Got It!
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
