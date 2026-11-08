import React, { useState, useEffect, useRef } from "react";
import {
	X,
	MapPin,
	Calendar,
	Users,
	DollarSign,
	Loader2,
	Compass,
	Sparkles,
	Building2,
	Leaf,
	ShieldCheck,
	Lock,
	CheckCircle2,
	Clock,
	Heart,
	MessageSquare,
	Wind,
	Cigarette,
	Music,
	Briefcase,
	Zap,
	Repeat,
	Plus,
	Trash2,
	Car,
	Gauge,
	Info
} from "lucide-react";
import { fetchPlaceSuggestions } from "../../utils/geoService";
import { POPULAR_TECH_PARKS } from "../../utils/companyBadges";

function PublishRideModal({ onClose, onPublish, userLocation }) {
	const [originInput, setOriginInput] = useState("");
	const [originData, setOriginData] = useState(null); // { lat, lng, address }

	const [destInput, setDestInput] = useState("");
	const [destData, setDestData] = useState(null); // { lat, lng, address }
	const [selectedTechPark, setSelectedTechPark] = useState("");

	const [departureTime, setDepartureTime] = useState("");
	const [targetArrivalTime, setTargetArrivalTime] = useState("08:50 AM");
	const [isFemaleOnly, setIsFemaleOnly] = useState(false);
	const [seats, setSeats] = useState(4);
	const [fare, setFare] = useState("45");
	const [fareBreakdown, setFareBreakdown] = useState(null);
	const [estimatingFare, setEstimatingFare] = useState(false);
	const [driverVehicle, setDriverVehicle] = useState(null);

	// BlaBlaCar Preferences
	const [chattiness, setChattiness] = useState("blabla"); // 'bla', 'blabla', 'blablabla'
	const [acEnabled, setAcEnabled] = useState(true);
	const [noSmoking, setNoSmoking] = useState(true);
	const [musicEnabled, setMusicEnabled] = useState(true);
	const [maxTwoBack, setMaxTwoBack] = useState(true);
	const [luggageSize, setLuggageSize] = useState("medium"); // 'small', 'medium', 'large'
	const [instantBooking, setInstantBooking] = useState(true);
	const [isRecurring, setIsRecurring] = useState(false);

	// Intermediate Stopovers
	const [stopovers, setStopovers] = useState([]);
	const [stopoverInput, setStopoverInput] = useState("");

	const [originSuggestions, setOriginSuggestions] = useState([]);
	const [destSuggestions, setDestSuggestions] = useState([]);
	const [loadingOrigin, setLoadingOrigin] = useState(false);
	const [loadingDest, setLoadingDest] = useState(false);

	const [showOriginDropdown, setShowOriginDropdown] = useState(false);
	const [showDestDropdown, setShowDestDropdown] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const originRef = useRef(null);
	const destRef = useRef(null);

	// Click outside listener to close dropdowns
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (originRef.current && !originRef.current.contains(e.target)) {
				setShowOriginDropdown(false);
			}
			if (destRef.current && !destRef.current.contains(e.target)) {
				setShowDestDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Load driver's verified vehicle specifications & fuel consumption ratio
	useEffect(() => {
		let isMounted = true;
		const fetchDriverVehicle = async () => {
			try {
				const token = localStorage.getItem("token");
				if (!token) return;
				const res = await fetch("/register-vehicle", {
					headers: { Authorization: `Bearer ${token}` }
				});
				const data = await res.json();
				if (isMounted && data.success && data.vehicle) {
					setDriverVehicle(data.vehicle);
					if (data.vehicle.seating_capacity) {
						setSeats(Math.max(1, data.vehicle.seating_capacity));
					}
				}
			} catch (err) {
				console.warn("Could not load driver vehicle specs:", err);
			}
		};
		fetchDriverVehicle();
		return () => { isMounted = false; };
	}, []);

	// Set default origin to Current Location when GPS is detected
	useEffect(() => {
		if (
			userLocation &&
			(!originInput || originInput === "Your Current Location")
		) {
			setOriginInput("Your Current Location");
			setOriginData({
				lat: userLocation[0],
				lng: userLocation[1],
				address: "Your Current Location",
			});
		}
		//eslint-disable-next-line
	}, [userLocation]);

	// Fetch suggestions for Origin
	useEffect(() => {
		if (!originInput.trim() || originInput.trim().length < 2) {
			setOriginSuggestions([]);
			setShowOriginDropdown(false);
			return;
		}

		// Skip if input matches the selected data address exactly
		if (originData && originInput === originData.address) {
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingOrigin(true);
			const results = await fetchPlaceSuggestions(originInput, userLocation);
			setOriginSuggestions(results);
			setShowOriginDropdown(true);
			setLoadingOrigin(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [originInput, userLocation, originData]);

	// Fetch suggestions for Destination
	useEffect(() => {
		if (!destInput.trim() || destInput.trim().length < 2) {
			setDestSuggestions([]);
			setShowDestDropdown(false);
			return;
		}

		// Skip if input matches the selected data address exactly
		if (destData && destInput === destData.address) {
			return;
		}

		const timer = setTimeout(async () => {
			setLoadingDest(true);
			const results = await fetchPlaceSuggestions(destInput, userLocation);
			setDestSuggestions(results);
			setShowDestDropdown(true);
			setLoadingDest(false);
		}, 250);

		return () => clearTimeout(timer);
	}, [destInput, userLocation, destData]);

	// Fetch dynamic corporate fare calculation & green subsidy estimate
	useEffect(() => {
		if (!originData || !destData) return;
		let isCancelled = false;

		const fetchEstimate = async () => {
			setEstimatingFare(true);
			try {
				const token = localStorage.getItem("token");
				const res = await fetch("/rides/fare-estimate", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						origin: originData,
						destination: destData,
						seats: parseInt(seats, 10) || 4
					})
				});
				const data = await res.json();
				if (!isCancelled && data.success) {
					setFareBreakdown(data);
					setFare(data.recommendedPassengerFare.toString());
				}
			} catch (e) {
				console.warn("Error fetching fare estimate:", e);
			} finally {
				if (!isCancelled) setEstimatingFare(false);
			}
		};

		fetchEstimate();
		return () => { isCancelled = true; };
	}, [originData, destData, seats]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!originData) {
			setError("Please select a valid origin from the suggestions.");
			return;
		}
		if (!destData) {
			setError("Please select a valid destination from the suggestions.");
			return;
		}
		if (!departureTime) {
			setError("Please select a departure time.");
			return;
		}
		if (!fare || parseFloat(fare) <= 0) {
			setError("Please enter a valid fare per seat.");
			return;
		}

		setSubmitting(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/publish-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					origin: originData,
					destination: destData,
					departure_time: departureTime,
					seats: parseInt(seats),
					fare_per_seat: parseFloat(fare),
					subsidy_per_seat: fareBreakdown ? fareBreakdown.subsidyPerSeat : undefined,
					is_female_only: isFemaleOnly,
					destination_tech_park: selectedTechPark || destData.address || destInput,
					target_arrival_time: targetArrivalTime,
					preferences: {
						chattiness,
						ac: acEnabled,
						smoking: !noSmoking,
						music: musicEnabled,
						luggage: luggageSize,
						max_two_back: maxTwoBack
					},
					stopovers,
					is_recurring: isRecurring,
					instant_booking: instantBooking
				}),
			});

			const data = await res.json();
			if (res.ok && data.success) {
				onPublish(data);
			} else {
				setError(
					data.message || "Failed to publish ride. Please try again.",
				);
			}
		} catch (err) {
			console.error("Error publishing ride:", err);
			setError("A network error occurred. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
			<div className="bg-white rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.25)] border border-neutral-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				{/* Top Yellow Accent Bar */}
				<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black shadow-xs font-bold">
							<Compass className="w-5 h-5 stroke-[2.5]" />
						</div>
						<h2 className="text-xl font-black text-black">
							Publish a Ride
						</h2>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
					>
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Body */}
				<div className="overflow-y-auto p-6">
					{error && (
						<div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm font-medium">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Origin Input */}
						<div className="space-y-1.5 relative" ref={originRef}>
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-emerald-600" />
								Origin Address
							</label>
							<div className="relative">
								<input
									required
									type="text"
									value={originInput}
									onChange={(e) => {
										setOriginInput(e.target.value);
										if (originData) setOriginData(null);
									}}
									placeholder="Search departure location..."
									className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
								/>
								{loadingOrigin && (
									<div className="absolute right-3.5 top-3.5">
										<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
									</div>
								)}
							</div>

							{/* Origin Suggestions Dropdown */}
							{showOriginDropdown && originSuggestions.length > 0 && (
								<div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto z-50 py-1">
									{originSuggestions.map((item, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => {
												setOriginInput(item.fullAddress);
												setOriginData({
													lat: item.coords[0],
													lng: item.coords[1],
													address: item.fullAddress,
												});
												setShowOriginDropdown(false);
											}}
											className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
										>
											<MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-semibold text-gray-800">
													{item.title}
												</p>
												{item.subtitle && (
													<p className="text-xs text-gray-400 mt-0.5">
														{item.subtitle}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Destination Tech Park Quick Chips */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
									<Building2 className="w-3.5 h-3.5 text-teal-600" />
									Destination Tech Park
								</label>
								<span className="text-[10px] text-teal-600 font-bold">1-Click Presets</span>
							</div>
							<div className="flex flex-wrap gap-1.5">
								{POPULAR_TECH_PARKS.slice(0, 4).map((park) => (
									<button
										key={park.id}
										type="button"
										onClick={() => {
											setDestInput(`${park.name}, ${park.area}`);
											setDestData({
												lat: park.lat,
												lng: park.lng,
												address: `${park.name}, ${park.city}`,
											});
											setSelectedTechPark(park.name);
											setShowDestDropdown(false);
										}}
										className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
											selectedTechPark === park.name
												? "bg-slate-900 text-teal-300 border-slate-900 shadow-xs"
												: "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
										}`}
									>
										{park.name.split(" ")[0]} ({park.city})
									</button>
								))}
							</div>
						</div>

						{/* Destination Input */}
						<div className="space-y-1.5 relative" ref={destRef}>
							<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
								<MapPin className="w-3.5 h-3.5 text-rose-600" />
								Destination Tech Park / Office Address
							</label>
							<div className="relative">
								<input
									required
									type="text"
									value={destInput}
									onChange={(e) => {
										setDestInput(e.target.value);
										if (destData) setDestData(null);
									}}
									placeholder="Search drop-off location..."
									className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
								/>
								{loadingDest && (
									<div className="absolute right-3.5 top-3.5">
										<Loader2 className="w-4 h-4 animate-spin text-gray-400" />
									</div>
								)}
							</div>

							{/* Destination Suggestions Dropdown */}
							{showDestDropdown && destSuggestions.length > 0 && (
								<div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-52 overflow-y-auto z-50 py-1">
									{destSuggestions.map((item, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => {
												setDestInput(item.fullAddress);
												setDestData({
													lat: item.coords[0],
													lng: item.coords[1],
													address: item.fullAddress,
												});
												setShowDestDropdown(false);
											}}
											className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
										>
											<MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-semibold text-gray-800">
													{item.title}
												</p>
												{item.subtitle && (
													<p className="text-xs text-gray-400 mt-0.5">
														{item.subtitle}
													</p>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{/* Departure Time */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5 text-gray-500" />
									Departure Time
								</label>
								<input
									required
									type="datetime-local"
									value={departureTime}
									onChange={(e) => setDepartureTime(e.target.value)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
								/>
							</div>

							{/* Target Arrival Time */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
									<Clock className="w-3.5 h-3.5 text-teal-600" />
									Target Arrival Time
								</label>
								<select
									value={targetArrivalTime}
									onChange={(e) => setTargetArrivalTime(e.target.value)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
								>
									<option value="08:30 AM">08:30 AM (Early Shift)</option>
									<option value="08:45 AM">08:45 AM (Standard Shift)</option>
									<option value="09:00 AM">09:00 AM (Peak Shift)</option>
									<option value="09:15 AM">09:15 AM (Flexible Shift)</option>
									<option value="09:30 AM">09:30 AM (Late Morning)</option>
								</select>
							</div>
						</div>

						{/* Female-Only Commute Toggle */}
						<div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl flex items-center justify-between">
							<div className="flex items-center gap-2.5">
								<div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
									<Heart className="w-4 h-4 fill-white" />
								</div>
								<div>
									<h4 className="text-xs font-bold text-slate-900">Female-Only Commute</h4>
									<p className="text-[11px] text-slate-500">Only verified female colleagues can view and book</p>
								</div>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									checked={isFemaleOnly}
									onChange={(e) => setIsFemaleOnly(e.target.checked)}
									className="sr-only peer"
								/>
								<div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
							</label>
						</div>

						{/* Recurring Commute & Instant Booking Quick Toggles */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
							<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Repeat className={`w-4 h-4 ${isRecurring ? "text-teal-600" : "text-slate-400"}`} />
									<div>
										<p className="text-xs font-bold text-slate-800">Recurring Commute</p>
										<p className="text-[10px] text-slate-500">Mon-Fri Daily Office</p>
									</div>
								</div>
								<input
									type="checkbox"
									checked={isRecurring}
									onChange={(e) => setIsRecurring(e.target.checked)}
									className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
								/>
							</div>

							<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Zap className={`w-4 h-4 ${instantBooking ? "text-amber-500" : "text-slate-400"}`} />
									<div>
										<p className="text-xs font-bold text-slate-800">Instant Booking</p>
										<p className="text-[10px] text-slate-500">Auto-confirm seats</p>
									</div>
								</div>
								<input
									type="checkbox"
									checked={instantBooking}
									onChange={(e) => setInstantBooking(e.target.checked)}
									className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
								/>
							</div>
						</div>

						{/* BlaBlaCar Commute Preferences & Chattiness Meter */}
						<div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
							<div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
								<div className="flex items-center gap-2">
									<MessageSquare className="w-4 h-4 text-purple-600" />
									<span className="text-xs font-black uppercase tracking-wider text-slate-800">
										BlaBlaCar Commute Preferences
									</span>
								</div>
								<span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
									BlaBla Meter
								</span>
							</div>

							{/* Chattiness Meter (Bla / BlaBla / BlaBlaBla) */}
							<div className="space-y-1.5">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
									Chattiness Preference
								</label>
								<div className="grid grid-cols-3 gap-1.5 text-center">
									{[
										{ id: "bla", label: "Bla", desc: "Quiet & focused" },
										{ id: "blabla", label: "BlaBla", desc: "Friendly chat" },
										{ id: "blablabla", label: "BlaBlaBla", desc: "Super chatty" }
									].map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() => setChattiness(item.id)}
											className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
												chattiness === item.id
													? "bg-black text-yellow-400 border-black shadow-xs"
													: "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
											}`}
										>
											<span className="block font-black text-xs">{item.label}</span>
											<span className={`block text-[9px] font-normal mt-0.5 ${chattiness === item.id ? "text-purple-200" : "text-slate-400"}`}>
												{item.desc}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Amenities Chips (AC, Smoking, Music, Max 2 in back) */}
							<div className="space-y-1.5 pt-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
									Ride Amenities & Rules
								</label>
								<div className="flex flex-wrap gap-1.5">
									<button
										type="button"
										onClick={() => setAcEnabled(!acEnabled)}
										className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
											acEnabled
												? "bg-sky-50 text-sky-700 border-sky-300"
												: "bg-white text-slate-400 border-slate-200 opacity-60"
										}`}
									>
										<Wind className="w-3.5 h-3.5" />
										<span>❄️ AC {acEnabled ? "On" : "Off"}</span>
									</button>

									<button
										type="button"
										onClick={() => setNoSmoking(!noSmoking)}
										className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
											noSmoking
												? "bg-emerald-50 text-emerald-700 border-emerald-300"
												: "bg-white text-slate-400 border-slate-200 opacity-60"
										}`}
									>
										<Cigarette className="w-3.5 h-3.5" />
										<span>🚭 {noSmoking ? "No Smoking" : "Smoking Allowed"}</span>
									</button>

									<button
										type="button"
										onClick={() => setMusicEnabled(!musicEnabled)}
										className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
											musicEnabled
												? "bg-purple-50 text-purple-700 border-purple-300"
												: "bg-white text-slate-400 border-slate-200 opacity-60"
										}`}
									>
										<Music className="w-3.5 h-3.5" />
										<span>🎵 {musicEnabled ? "Music / Podcasts" : "Quiet Ride"}</span>
									</button>

									<button
										type="button"
										onClick={() => setMaxTwoBack(!maxTwoBack)}
										className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
											maxTwoBack
												? "bg-teal-50 text-teal-700 border-teal-300"
												: "bg-white text-slate-400 border-slate-200 opacity-60"
										}`}
										title="Guarantees the middle rear seat is empty for coworker comfort"
									>
										<Users className="w-3.5 h-3.5" />
										<span>👥 Max 2 in Back {maxTwoBack ? "✓" : "✕"}</span>
									</button>
								</div>
							</div>

							{/* Luggage Allowance */}
							<div className="space-y-1.5 pt-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
									Luggage Allowance
								</label>
								<div className="grid grid-cols-3 gap-1.5">
									{[
										{ id: "small", label: "🎒 Small", sub: "Backpack / Laptop" },
										{ id: "medium", label: "🧳 Medium", sub: "Cabin Trolley" },
										{ id: "large", label: "📦 Large", sub: "Full Trunk Luggage" }
									].map((lug) => (
										<button
											key={lug.id}
											type="button"
											onClick={() => setLuggageSize(lug.id)}
											className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
												luggageSize === lug.id
													? "bg-teal-50 border-teal-500 text-teal-900"
													: "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
											}`}
										>
											<span className="text-xs font-extrabold block">{lug.label}</span>
											<span className="text-[9px] text-slate-400 block truncate">{lug.sub}</span>
										</button>
									))}
								</div>
							</div>
						</div>

						{/* Intermediate Corridor Stopovers (BlaBlaCar Waypoints) */}
						<div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
									<MapPin className="w-3.5 h-3.5 text-teal-600" /> En-Route Stopovers
								</label>
								<span className="text-[10px] text-slate-400 font-medium">Pickup/drop along the way</span>
							</div>

							{/* Current Stopovers List */}
							{stopovers.length > 0 && (
								<div className="space-y-1.5">
									{stopovers.map((stop, idx) => (
										<div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs">
											<span className="flex items-center gap-2 font-semibold text-slate-800">
												<span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
												{stop}
											</span>
											<button
												type="button"
												onClick={() => setStopovers(stopovers.filter((_, i) => i !== idx))}
												className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</button>
										</div>
									))}
								</div>
							)}

							{/* Add Stopover input */}
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="e.g. Silk Board Junction or Bellandur Gate"
									value={stopoverInput}
									onChange={(e) => setStopoverInput(e.target.value)}
									className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
								/>
								<button
									type="button"
									onClick={() => {
										if (stopoverInput.trim() && !stopovers.includes(stopoverInput.trim())) {
											setStopovers([...stopovers, stopoverInput.trim()]);
											setStopoverInput("");
										}
									}}
									className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
								>
									<Plus className="w-3.5 h-3.5" /> Add
								</button>
							</div>

							{/* Quick Preset Tech Park Chips */}
							<div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 text-[10px]">
								<span className="text-slate-400 shrink-0 font-bold uppercase text-[9px]">Corridor Presets:</span>
								{POPULAR_TECH_PARKS.slice(0, 4).map((park) => (
									<button
										key={park.id}
										type="button"
										onClick={() => {
											if (!stopovers.includes(park.name)) {
												setStopovers([...stopovers, park.name]);
											}
										}}
										className="px-2 py-0.5 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 rounded-md whitespace-nowrap cursor-pointer transition-colors"
									>
										+ {park.name.split(" ")[0]}
									</button>
								))}
							</div>
						</div>

						{/* Driver Certified Vehicle Banner */}
						{driverVehicle && (
							<div className="p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center justify-between text-xs border border-slate-700 shadow-xs">
								<div className="flex items-center gap-2">
									<div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
										<Car className="w-4 h-4" />
									</div>
									<div>
										<span className="font-bold text-white block text-xs">
											{driverVehicle.vehicle_model}
										</span>
										<span className="text-[10px] text-slate-300 font-mono">
											{driverVehicle.veh_no} • {driverVehicle.seating_capacity} Seater
										</span>
									</div>
								</div>
								<div className="text-right">
									<span className="text-[9px] uppercase tracking-wider text-teal-400 font-bold block">
										Certified Fuel Ratio
									</span>
									<span className="text-xs font-mono font-bold text-slate-200">
										{driverVehicle.fuel_consumption_ratio || "1.00"}x Burn
									</span>
								</div>
							</div>
						)}

						<div className="grid grid-cols-2 gap-4">
							{/* Seats */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
										<Users className="w-3.5 h-3.5 text-gray-500" />
										Offered Seats
									</label>
									{driverVehicle && (
										<span className="text-[10px] text-gray-400">
											Max {driverVehicle.seating_capacity}
										</span>
									)}
								</div>
								<input
									required
									type="number"
									min="1"
									max={driverVehicle?.seating_capacity || 8}
									value={seats}
									onChange={(e) => setSeats(Math.min(driverVehicle?.seating_capacity || 8, Math.max(1, parseInt(e.target.value) || 1)))}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
								/>
							</div>

							{/* Algorithmic Fare Per Seat (Locked for Legal Compliance) */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
										<Lock className="w-3.5 h-3.5 text-teal-600" />
										Cost-Share / Seat
									</label>
									<span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
										White-Plate Locked
									</span>
								</div>
								<div className="relative">
									<input
										readOnly
										type="number"
										value={fare}
										className="w-full px-4 py-3 bg-slate-100/90 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 cursor-not-allowed select-none font-mono"
									/>
									<span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold">
										₹ / seat
									</span>
								</div>
							</div>
						</div>

						{/* White-Plate Algorithmic Pricing Breakdown Card */}
						{fareBreakdown ? (
							<div className="bg-gradient-to-br from-teal-50/80 via-white to-slate-50 border border-teal-200/80 rounded-2xl p-4 space-y-2.5 text-xs animate-in fade-in duration-200 shadow-xs">
								<div className="flex items-center justify-between border-b border-teal-100/80 pb-2">
									<div className="flex items-center gap-1.5 text-teal-900 font-bold">
										<ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
										<span>White-Plate Legal Pricing (Sec 66 MVA)</span>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono">
											{fareBreakdown.distanceKm} km {fareBreakdown.isOsrmVerified ? "• OSRM Road" : ""}
										</span>
										{fareBreakdown.durationMins && (
											<span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
												~{fareBreakdown.durationMins}m
											</span>
										)}
									</div>
								</div>

								<div className="grid grid-cols-3 gap-2.5 pt-0.5 text-[11px]">
									<div className="bg-white/80 p-2 rounded-lg border border-slate-100">
										<span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Total Trip Fuel</span>
										<span className="font-bold text-gray-800 font-mono text-xs">₹{fareBreakdown.totalTripFuelCost}</span>
										<span className="text-[9px] text-gray-400 block mt-0.5">({fareBreakdown.fuelRatio || "1.0"}x ratio)</span>
									</div>
									<div className="bg-white/80 p-2 rounded-lg border border-slate-100">
										<span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Org Green Subsidy</span>
										<span className="font-bold text-emerald-600 font-mono text-xs">-₹{fareBreakdown.subsidyPerSeat}</span>
										<span className="text-[9px] text-emerald-700 block mt-0.5">per colleague</span>
									</div>
									<div className="bg-white/80 p-2 rounded-lg border border-slate-100">
										<span className="text-gray-400 block text-[9px] uppercase font-bold tracking-tight">Colleague Fare</span>
										<span className="font-bold text-teal-700 font-mono text-xs">
											₹{fare}
										</span>
										<span className="text-[9px] text-slate-500 block mt-0.5">
											(Driver: ₹{(parseFloat(fare) || 0) + (fareBreakdown.subsidyPerSeat || 0)})
										</span>
									</div>
								</div>

								<div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-2 text-[10px] text-slate-600 leading-relaxed">
									<Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
									<p>
										<strong>Zero Driver Markup:</strong> Fares are algorithmically locked based on exact OSRM road distance, your vehicle's certified fuel consumption ratio ({fareBreakdown.fuelRatio || "1.0"}x), and seat split. Total reimbursements strictly equal variable trip fuel expenditure.
									</p>
								</div>
							</div>
						) : estimatingFare ? (
							<div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-center justify-center gap-2 text-xs text-teal-800">
								<Loader2 className="w-4 h-4 animate-spin text-teal-600" />
								<span>Calculating OSRM road distance and legal fuel cost-share...</span>
							</div>
						) : (
							<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
								<ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
								<div>
									<span className="font-bold text-slate-800">White-Plate Legal Pricing: </span>
									Select origin and destination to calculate the non-profit fuel split. Drivers cannot manually adjust fares.
								</div>
							</div>
						)}

						{/* Submit button */}
						<div className="pt-4">
							<button
								type="submit"
								disabled={submitting}
								className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
							>
								{submitting ? (
									<>
										<Loader2 className="w-5 h-5 animate-spin" />
										Publishing Ride...
									</>
								) : (
									"Publish Ride"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default PublishRideModal;
