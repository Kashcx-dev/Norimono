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
	Trash2
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
		<div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-[#714B67]/10 rounded-full flex items-center justify-center text-[#714B67]">
							<Compass className="w-5 h-5" />
						</div>
						<h2 className="text-xl font-bold text-gray-900">
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
									className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
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
									className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
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
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
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
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
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
													? "bg-[#714B67] text-white border-[#714B67] shadow-xs"
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

						<div className="grid grid-cols-2 gap-4">
							{/* Seats */}
							<div className="space-y-1.5">
								<label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
									<Users className="w-3.5 h-3.5 text-gray-500" />
									Available Seats
								</label>
								<input
									required
									type="number"
									min="1"
									max="8"
									value={seats}
									onChange={(e) => setSeats(e.target.value)}
									className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
								/>
							</div>

							{/* Algorithmic Fare Per Seat (Locked for Legal Compliance) */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
										<Lock className="w-3.5 h-3.5 text-amber-600" />
										Algorithmic Cost-Share
									</label>
									<span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
										Locked
									</span>
								</div>
								<div className="relative">
									<input
										readOnly
										type="number"
										value={fare}
										className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 cursor-not-allowed select-none font-mono"
									/>
									<span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold">
										₹ / seat
									</span>
								</div>
							</div>
						</div>

						{/* Legal Cost-Sharing Compliance Note */}
						<div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
							<ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
							<div>
								<span className="font-bold text-slate-800">Legal Non-Profit Cost-Sharing: </span>
								Drivers cannot manually increase fares. Cost is locked algorithmically by route distance, standard fuel rate, and seat split in accordance with non-commercial white-plate transit regulations.
							</div>
						</div>

						{/* Corporate Green Commute Subsidy Breakdown Card */}
						{fareBreakdown && (
							<div className="bg-gradient-to-r from-teal-50/70 via-white to-purple-50/70 border border-teal-100/80 rounded-2xl p-3.5 space-y-2 text-xs animate-in fade-in duration-200">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5 text-teal-800 font-bold">
										<Sparkles className="w-4 h-4 text-[#00A09D]" />
										<span>Corporate Fair-Share Commute Pricing</span>
									</div>
									<span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
										{fareBreakdown.distanceKm} km trip
									</span>
								</div>

								<div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-[11px]">
									<div>
										<span className="text-gray-400 block text-[9px] uppercase font-bold">Trip Fuel Cost</span>
										<span className="font-bold text-gray-800 font-mono">₹{fareBreakdown.totalTripFuelCost}</span>
									</div>
									<div>
										<span className="text-gray-400 block text-[9px] uppercase font-bold">Org Green Subsidy</span>
										<span className="font-bold text-emerald-600 font-mono">+₹{fareBreakdown.subsidyPerSeat}/seat</span>
									</div>
									<div>
										<span className="text-gray-400 block text-[9px] uppercase font-bold">Total Driver Payout</span>
										<span className="font-bold text-[#714B67] font-mono">
											₹{(parseFloat(fare) || 0) + (fareBreakdown.subsidyPerSeat || 0)}/seat
										</span>
									</div>
								</div>

								<p className="text-[10px] text-gray-500 leading-tight">
									💡 Your organization covers <strong>₹{fareBreakdown.subsidyPerSeat}</strong> per passenger as an eco-friendly travel subsidy. Passengers pay only <strong>₹{fare || 0}</strong>.
								</p>
							</div>
						)}

						{/* Submit button */}
						<div className="pt-4">
							<button
								type="submit"
								disabled={submitting}
								className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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
