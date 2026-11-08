import React, { useState, useEffect, useRef } from "react";
import { 
	User, 
	Mail, 
	Lock, 
	Phone, 
	Shield, 
	ArrowRight, 
	ArrowLeft, 
	Car, 
	CheckCircle2, 
	Clock, 
	AlertTriangle, 
	Check, 
	Search, 
	Building2, 
	Sparkles, 
	RefreshCw,
	FileText,
	KeyRound,
	MapPin,
	Navigation,
	Loader2
} from "lucide-react";
import vehicleCatalog from "../data/vehicle_catalog.json";
import { io } from "socket.io-client";
import { getCompanyInfo } from "../utils/companyBadges";
import { reverseGeocodeIndia, fetchIndiaPlaceSuggestions } from "../utils/geoService";

function checkPasswordStrength(password) {
	let score = 0;
	let feedback = [];

	if (!password) return { score: 0, strength: "Weak", feedback: [] };

	if (password.length > 8) score += 1;
	else feedback.push("Longer than 8 chars");

	if (password.length >= 12) score += 1;

	if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
	else feedback.push("Upper & lowercase");

	if (/\d/.test(password)) score += 1;
	else feedback.push("At least one number");

	if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
	else feedback.push("Special character");

	let strength = "Weak";
	if (score >= 4) strength = "Strong";
	else if (score === 3) strength = "Medium";

	return { score, strength, feedback };
}

function Signup({ onSwitchToLogin, onSignupSuccess }) {
	// Stepper: 1 = Basic Info & Mode, 2 = Driver Credentials (Rider only), 3 = OTP, "waiting" = Rider Approval Queue
	const [currentStep, setCurrentStep] = useState(1);

	// Step 1: Personal & Account
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [organization, setOrganization] = useState("TCS");
	const [corporateDomain, setCorporateDomain] = useState("");
	const [role, setRole] = useState("employee"); // 'employee' or 'admin'
	const [riderType, setRiderType] = useState("passenger"); // 'passenger' or 'rider'
	const [gender, setGender] = useState("female"); // 'female' | 'male' | 'other' (Crucial for female-only rides!)
	const [designation, setDesignation] = useState("Senior Cloud Architect");
	const [department, setDepartment] = useState("Technology Operations");

	// Location State (India Only with Auto-Detect GPS)
	const [location, setLocation] = useState("");
	const [locationCoords, setLocationCoords] = useState(null);
	const [isLocating, setIsLocating] = useState(false);
	const [locationError, setLocationError] = useState("");
	const [locationSuggestions, setLocationSuggestions] = useState([]);
	const [showLocationDropdown, setShowLocationDropdown] = useState(false);
	const locationRef = useRef(null);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);

	// Step 2: Driver & Vehicle Credentials (Rider Only)
	const [dlNo, setDlNo] = useState("");
	const [vehicleModel, setVehicleModel] = useState("");
	const [vehicleNo, setVehicleNo] = useState("");
	const [seatingCapacity, setSeatingCapacity] = useState(4);
	const [fuelRatio, setFuelRatio] = useState(1.0);
	const [insuranceNo, setInsuranceNo] = useState("");
	const [modelSearch, setModelSearch] = useState("");
	const [modelSuggestions, setModelSuggestions] = useState([]);
	const [showModelDropdown, setShowModelDropdown] = useState(false);
	const modelInputRef = useRef(null);

	// Step 3: OTP Verification
	const [otp, setOtp] = useState("");
	const [devOtpHint, setDevOtpHint] = useState("");

	// Waiting Screen State
	const [registeredUserData, setRegisteredUserData] = useState(null);
	const [verificationData, setVerificationData] = useState(null);
	const [isApprovedLive, setIsApprovedLive] = useState(false);
	const [checkingStatus, setCheckingStatus] = useState(false);

	// Common UI state
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// Auto-detect corporate domain & organization from email
	useEffect(() => {
		if (email && email.includes("@")) {
			const domain = email.split("@")[1].toLowerCase();
			setCorporateDomain(domain);
			const info = getCompanyInfo(email);
			if (info && info.shortName && info.shortName !== "CORP") {
				setOrganization(info.shortName);
			}
		} else {
			setCorporateDomain("");
		}
	}, [email]);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleOutside = (e) => {
			if (locationRef.current && !locationRef.current.contains(e.target)) {
				setShowLocationDropdown(false);
			}
			if (modelInputRef.current && !modelInputRef.current.contains(e.target)) {
				setShowModelDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleOutside);
		return () => document.removeEventListener("mousedown", handleOutside);
	}, []);

	// Filter vehicle catalog suggestions
	useEffect(() => {
		if (!modelSearch || modelSearch.trim().length < 2) {
			setModelSuggestions([]);
			return;
		}
		const q = modelSearch.toLowerCase();
		const matches = vehicleCatalog
			.filter(item => item.name && item.name.toLowerCase().includes(q))
			.slice(0, 6);
		setModelSuggestions(matches);
	}, [modelSearch]);

	// Listen for live approval via Socket.io when in waiting state
	useEffect(() => {
		if (currentStep !== "waiting" || !registeredUserData) return;

		let socket;
		try {
			socket = io(window.location.origin);
			if (registeredUserData.emp_id) {
				socket.emit("register_user", { emp_id: registeredUserData.emp_id });
			}
			socket.on("rider_verification_status", (data) => {
				if (data.status === "approved") {
					setIsApprovedLive(true);
					const updated = { ...registeredUserData, is_vehicle_registered: "2" };
					localStorage.setItem("user", JSON.stringify(updated));
					setRegisteredUserData(updated);
				}
			});
		} catch (err) {
			console.warn("Socket connect error in waiting screen:", err);
		}

		return () => {
			if (socket) socket.disconnect();
		};
	}, [currentStep, registeredUserData]);

	// Auto-detect user GPS location within India
	const handleAutoDetectLocation = () => {
		setLocationError("");
		if (!navigator.geolocation) {
			setLocationError("Geolocation is not supported on this device.");
			return;
		}
		setIsLocating(true);
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const { latitude, longitude } = position.coords;
				const res = await reverseGeocodeIndia(latitude, longitude);
				setIsLocating(false);
				if (res.success) {
					setLocation(res.address);
					setLocationCoords(res.coords);
					setShowLocationDropdown(false);
				} else {
					setLocationError(res.error || "Could not detect Indian location.");
				}
			},
			(err) => {
				setIsLocating(false);
				let msg = "GPS permission denied. Please tap 'Allow' or type your area.";
				if (err.code === 2) msg = "GPS signal unavailable. Please type your area.";
				else if (err.code === 3) msg = "GPS timed out. Please tap retry.";
				setLocationError(msg);
			},
			{ timeout: 10000, enableHighAccuracy: true }
		);
	};

	// India Place Suggestions when typing
	useEffect(() => {
		if (!location || location.trim().length < 2) {
			setLocationSuggestions([]);
			return;
		}

		// Don't search if location matches an already picked suggestion
		const timer = setTimeout(async () => {
			const results = await fetchIndiaPlaceSuggestions(location);
			setLocationSuggestions(results);
			if (results.length > 0) setShowLocationDropdown(true);
		}, 300);

		return () => clearTimeout(timer);
	}, [location]);

	const handleSelectModel = (item) => {
		setVehicleModel(item.name);
		setModelSearch(item.name);
		if (item.seats) setSeatingCapacity(item.seats);
		if (item.fuel_consumption_ratio) setFuelRatio(item.fuel_consumption_ratio);
		setShowModelDropdown(false);
	};

	// Validate Step 1
	const handleNextFromStep1 = (e) => {
		e.preventDefault();
		setError("");

		if (!name.trim()) return setError("Please enter your full name.");
		if (!email.trim() || !email.includes("@")) return setError("Please enter a valid corporate email.");

		const lowerEmail = email.toLowerCase().trim();
		if (lowerEmail.endsWith("@gmail.com") || lowerEmail.endsWith("@yahoo.com") || lowerEmail.endsWith("@hotmail.com")) {
			return setError("Verification Wall: Please use your official corporate work email (e.g. name@tcs.com) to access the closed-loop workplace network.");
		}

		if (!phone.trim()) return setError("Please enter your mobile phone number.");
		if (!location.trim()) return setError("Please auto-detect or enter your office commute location in India.");
		if (!password) return setError("Please create a password.");
		if (password !== confirmPassword) return setError("Passwords do not match.");
		if (!agreeTerms) return setError("Please agree to the Terms of Service & Corporate Commute Policy.");

		triggerSignupOtp();
	};

	// Trigger OTP request
	const triggerSignupOtp = () => {
		setError("");
		setIsLoading(true);

		const payload = {
			name: name.trim(),
			email: email.trim(),
			phone: phone.trim(),
			password,
			role,
			organization,
			rider_type: riderType,
			gender,
			designation,
			department,
			address: location.trim(),
			location: location.trim(),
			...(riderType === "rider" && {
				dl_no: dlNo.trim(),
				vehicle_no: vehicleNo.trim().toUpperCase(),
				vehicle_model: vehicleModel.trim() || modelSearch.trim(),
				seating_capacity: parseInt(seatingCapacity, 10) || 4,
				fuel_consumption_ratio: parseFloat(fuelRatio) || 1.0,
				insurance_no: insuranceNo.trim() || null
			})
		};

		fetch("/auth/signup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		})
		.then(res => {
			if (!res.ok) {
				return res.json().then(data => { throw new Error(data.message || "Failed to start registration.") });
			}
			return res.json();
		})
		.then(data => {
			setIsLoading(false);
			if (data.requires2FA) {
				setCurrentStep(3); // OTP step
				if (data.devOtp) {
					setDevOtpHint(data.devOtp);
					setOtp(data.devOtp);
				}
			} else if (data.token) {
				finishAuth(data);
			}
		})
		.catch(err => {
			setIsLoading(false);
			setError(err.message || "Network error. Please try again.");
		});
	};

	// Submit Step 2 (Rider Credentials)
	const handleSubmitStep2 = (e) => {
		e.preventDefault();
		setError("");

		if (!dlNo.trim()) return setError("Please enter your Driver's License Number.");
		const selectedModel = vehicleModel.trim() || modelSearch.trim();
		if (!selectedModel) return setError("Please select or enter your vehicle model.");
		if (!vehicleNo.trim()) return setError("Please enter your vehicle license plate / registration number.");

		triggerSignupOtp();
	};

	// Submit Step 3 (OTP)
	const handleVerifyOtp = (e) => {
		e.preventDefault();
		setError("");
		if (!otp.trim()) return setError("Please enter the 6-digit verification code.");

		setIsLoading(true);
		fetch("/auth/verify-signup-otp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
		})
		.then(res => {
			if (!res.ok) {
				return res.json().then(data => { throw new Error(data.message || "Invalid verification code.") });
			}
			return res.json();
		})
		.then(data => {
			setIsLoading(false);
			finishAuth(data);
		})
		.catch(err => {
			setIsLoading(false);
			setError(err.message || "Invalid OTP code. Please try again.");
		});
	};

	const finishAuth = (data) => {
		if (data.token) {
			localStorage.setItem("token", data.token);
			localStorage.setItem("user", JSON.stringify(data.user));
			setRegisteredUserData(data.user);
			if (data.verification) {
				setVerificationData(data.verification);
			}

			// If user is a Rider, take them to the Dedicated Waiting Screen!
			if (data.user.rider_type === "rider") {
				setCurrentStep("waiting");
			} else {
				// Passenger: direct dashboard entry
				onSignupSuccess?.({ ...data.user, organization });
			}
		}
	};

	// Manually re-check approval status on the waiting screen
	const handleCheckStatus = async () => {
		setCheckingStatus(true);
		try {
			const token = localStorage.getItem("token");
			const res = await fetch("/auth/rider-status", {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (data.success) {
				if (data.is_vehicle_registered === "2") {
					setIsApprovedLive(true);
					const updated = { ...registeredUserData, is_vehicle_registered: "2" };
					localStorage.setItem("user", JSON.stringify(updated));
					setRegisteredUserData(updated);
				} else if (data.verification) {
					setVerificationData(data.verification);
				}
			}
		} catch (err) {
			console.error("Error checking rider status:", err);
		} finally {
			setCheckingStatus(false);
		}
	};

	// ==========================================
	// RENDER: DEDICATED VERIFICATION WAITING SCREEN (FOR RIDERS)
	// ==========================================
	if (currentStep === "waiting") {
		return (
			<div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-300">
				{/* Top Status Gradient Bar */}
				<div className={`h-2.5 ${isApprovedLive ? 'bg-emerald-500' : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500'}`}></div>

				<div className="p-8 sm:p-10 space-y-6">
					{isApprovedLive ? (
						<div className="text-center space-y-3">
							<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm animate-bounce">
								<CheckCircle2 className="w-9 h-9" />
							</div>
							<h2 className="text-2xl font-black text-black tracking-tight">
								Driver Credentials Approved!
							</h2>
							<p className="text-xs text-neutral-600 max-w-sm mx-auto">
								Welcome aboard, <strong className="text-black">{registeredUserData?.name}</strong>! Your vehicle and DL credentials have been verified by your enterprise administrator.
							</p>
						</div>
					) : (
						<div className="text-center space-y-3">
							<div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 text-black shadow-[0_6px_16px_rgba(250,204,21,0.35)]">
								<Clock className="w-8 h-8 animate-pulse" />
								<span className="absolute -top-1 -right-1 flex h-4 w-4">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
								</span>
							</div>
							<h2 className="text-2xl font-black text-black tracking-tight">
								Driver Application Under Review
							</h2>
							<p className="text-xs text-neutral-600 max-w-sm mx-auto">
								Your driver registration has been submitted to the safety & mobility team. Applications are typically verified in a few minutes.
							</p>
						</div>
					)}

					{/* Application Summary Card */}
					<div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 space-y-3.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
						<div className="flex items-center justify-between border-b border-neutral-200 pb-3">
							<div className="flex items-center gap-2">
								<Car className="w-4 h-4 text-black" />
								<span className="text-xs font-black text-black uppercase tracking-wider">Submitted Credentials</span>
							</div>
							<span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
								isApprovedLive 
									? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
									: 'bg-yellow-100 text-amber-900 border border-yellow-300'
							}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${isApprovedLive ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`}></span>
								{isApprovedLive ? 'Approved' : 'Pending Review'}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-3 text-xs">
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">Driver Name</span>
								<span className="font-black text-black">{registeredUserData?.name || name}</span>
							</div>
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">Organization</span>
								<span className="font-black text-black">{organization}</span>
							</div>
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">Vehicle Model</span>
								<span className="font-black text-black truncate block">
									{verificationData?.vehicle_model || vehicleModel || modelSearch}
								</span>
							</div>
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">License Plate</span>
								<span className="font-mono font-black text-black">
									{verificationData?.vehicle_no || vehicleNo}
								</span>
							</div>
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">Driving License</span>
								<span className="font-mono font-black text-black">{verificationData?.dl_no || dlNo}</span>
							</div>
							<div>
								<span className="text-neutral-400 font-bold block text-[10px] uppercase">Seating Capacity</span>
								<span className="font-black text-black">{verificationData?.seating_capacity || seatingCapacity} Seats</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3 pt-2">
						{isApprovedLive ? (
							<button
								onClick={() => onSignupSuccess?.({ ...registeredUserData, is_vehicle_registered: "2", organization })}
								className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
							>
								<span>Start Offering Rides as Driver</span>
								<ArrowRight className="w-4 h-4 stroke-[2.5]" />
							</button>
						) : (
							<>
								<button
									onClick={() => onSignupSuccess?.({ ...registeredUserData, is_vehicle_registered: "1", organization })}
									className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-black text-sm rounded-xl transition-all shadow-[0_4px_0_#262626] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer"
								>
									<span>Continue to Dashboard as Passenger</span>
									<ArrowRight className="w-4 h-4 stroke-[2.5]" />
								</button>
								<div className="flex items-center justify-center">
									<button
										onClick={handleCheckStatus}
										disabled={checkingStatus}
										className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
									>
										<RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin text-amber-600' : ''}`} />
										<span>{checkingStatus ? 'Checking with safety queue...' : 'Check Approval Status'}</span>
									</button>
								</div>
							</>
						)}
					</div>

					{/* Compliance Hint */}
					<div className="p-3 bg-yellow-50/70 rounded-xl border border-yellow-200 flex items-start gap-2.5 text-xs text-neutral-800">
						<Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
						<p className="text-[11px] leading-relaxed text-neutral-700">
							<strong className="text-black">Norimono Safety Assurance:</strong> Only verified corporate personnel can publish rides. Passengers can verify your plate and DL in their trip view.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// ==========================================
	// RENDER: STEP 3 (OTP VERIFICATION)
	// ==========================================
	if (currentStep === 3) {
		return (
			<div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden text-left animate-in fade-in duration-200">
				<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>
				<div className="p-8">
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400 text-black mb-3 shadow-[0_6px_16px_rgba(250,204,21,0.35)]">
							<KeyRound className="w-7 h-7" />
						</div>
						<h3 className="text-xl font-black text-black">Verify Your Corporate Email</h3>
						<p className="text-xs text-neutral-500 mt-1">We sent a 6-digit verification code to <strong className="text-black">{email}</strong></p>
					</div>

					{error && (
						<div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
							<AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleVerifyOtp} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
								6-Digit OTP Code
							</label>
							<input
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder="000000"
								maxLength={6}
								className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-center tracking-[0.5em] text-2xl font-black text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
							/>
						</div>

						{devOtpHint && (
							<div className="flex items-center justify-between p-2.5 bg-yellow-50 rounded-xl border border-yellow-200 text-xs">
								<span className="text-amber-800 font-medium">Dev Test Code: <strong className="font-mono text-black font-bold">{devOtpHint}</strong></span>
								<button
									type="button"
									onClick={() => setOtp(devOtpHint)}
									className="px-2.5 py-1 bg-yellow-400 text-black rounded-lg text-[11px] font-black cursor-pointer hover:bg-yellow-300 shadow-xs"
								>
									Auto Fill
								</button>
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
							) : (
								<>Verify & Finalize Registration <ArrowRight className="w-4 h-4 stroke-[2.5]" /></>
							)}
						</button>

						<button
							type="button"
							onClick={() => setCurrentStep(riderType === "rider" ? 2 : 1)}
							className="w-full py-2 text-xs text-neutral-500 hover:text-black font-bold cursor-pointer"
						>
							← Back to Edit Details
						</button>
					</form>
				</div>
			</div>
		);
	}

	// ==========================================
	// RENDER: STEP 2 (RIDER / DRIVER CREDENTIALS)
	// ==========================================
	if (currentStep === 2) {
		return (
			<div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden text-left animate-in fade-in slide-in-from-right-4 duration-300">
				<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>

				<div className="p-7 sm:p-9">
					{/* Progress Header */}
					<div className="flex items-center justify-between mb-5 border-b border-neutral-100 pb-4">
						<div>
							<span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-yellow-100 px-2.5 py-0.5 rounded-full border border-yellow-300">
								Step 2 of 2: Driver Verification
							</span>
							<h2 className="text-xl font-black text-black mt-1">
								Vehicle & License Information
							</h2>
						</div>
						<div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-sm">
							<Car className="w-5 h-5" />
						</div>
					</div>

					{error && (
						<div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 animate-shake font-medium">
							<AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmitStep2} className="space-y-4">
						{/* DL Number */}
						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
								<span>Driver's License Number *</span>
								<span className="text-neutral-400 font-normal">State Issued</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={dlNo}
									onChange={(e) => {
										const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 18);
										setDlNo(cleaned);
									}}
									maxLength={18}
									pattern="[A-Z0-9 -]+"
									placeholder="e.g. DL-0420110012345"
									className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>
						</div>

						{/* Searchable Vehicle Model from Catalog */}
						<div className="space-y-1 relative" ref={modelInputRef}>
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
								<span>Vehicle Make & Model *</span>
								<span className="text-neutral-400 font-normal">Select or Type</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={modelSearch}
									onChange={(e) => {
										setModelSearch(e.target.value);
										setVehicleModel(e.target.value);
										setShowModelDropdown(true);
									}}
									onFocus={() => setShowModelDropdown(true)}
									placeholder="e.g. Maruti Swift Dzire, Honda City, Hyundai i20"
									className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>

							{/* Suggestions dropdown */}
							{showModelDropdown && modelSuggestions.length > 0 && (
								<div className="absolute top-full left-0 right-0 z-50 bg-white border border-neutral-200 rounded-2xl shadow-2xl mt-1 max-h-48 overflow-y-auto divide-y divide-neutral-100">
									{modelSuggestions.map((item, idx) => (
										<div
											key={idx}
											onMouseDown={() => handleSelectModel(item)}
											className="p-2.5 hover:bg-yellow-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
										>
											<div className="flex items-center gap-2">
												<Car className="w-3.5 h-3.5 text-black" />
												<span className="font-bold text-black">{item.name}</span>
											</div>
											<div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
												<span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-medium">{item.fuel_type}</span>
												<span className="bg-yellow-100 text-amber-900 px-1.5 py-0.5 rounded font-black">{item.seats} Seats</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Vehicle Registration Plate Number */}
						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
								<span>Vehicle Plate / Reg No. *</span>
								<span className="text-neutral-400 font-normal">State Format</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={vehicleNo}
									onChange={(e) => {
										const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 14);
										setVehicleNo(cleaned);
									}}
									maxLength={14}
									pattern="[A-Z0-9 -]+"
									placeholder="e.g. WB-02-AB-1234 or DL-01-A-1234"
									className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>
						</div>

						{/* Seats & Fuel Ratio */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
									Available Seats
								</label>
								<select
									value={seatingCapacity}
									onChange={(e) => setSeatingCapacity(parseInt(e.target.value, 10))}
									className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
								>
									<option value={1}>1 Seat</option>
									<option value={2}>2 Seats</option>
									<option value={3}>3 Seats</option>
									<option value={4}>4 Seats (Standard)</option>
									<option value={5}>5 Seats</option>
									<option value={6}>6 Seats (SUV/MUV)</option>
									<option value={7}>7 Seats</option>
								</select>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
									Insurance Policy No.
								</label>
								<input
									type="text"
									value={insuranceNo}
									onChange={(e) => setInsuranceNo(e.target.value.toUpperCase())}
									placeholder="e.g. POL-12345678"
									className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								/>
							</div>
						</div>

						{/* Notice */}
						<div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[11px] text-neutral-700 flex items-start gap-2">
							<Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
							<p className="leading-tight">
								By submitting, your vehicle will enter the <strong className="text-black">Corporate Verification Queue</strong>. Admin approval is required before you can publish rides.
							</p>
						</div>

						{/* Stepper Buttons */}
						<div className="flex items-center gap-3 pt-2">
							<button
								type="button"
								onClick={() => setCurrentStep(1)}
								className="w-1/3 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
							>
								<ArrowLeft className="w-3.5 h-3.5" /> Back
							</button>

							<button
								type="submit"
								disabled={isLoading}
								className="w-2/3 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl transition-all shadow-[0_4px_0_#CA8A04] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
								) : (
									<>Submit & Verify Email <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" /></>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	}

	// ==========================================
	// RENDER: STEP 1 (PERSONAL INFO & ROLE SELECTION)
	// ==========================================
	return (
		<div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden text-left transition-all duration-300">
			<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>

			<div className="p-7 sm:p-8">
				<div className="text-center mb-5">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-400 text-black mb-2 shadow-[0_6px_16px_rgba(250,204,21,0.35)]">
						<Car className="w-6 h-6" />
					</div>
					<h2 className="text-2xl font-black text-black tracking-tight">
						Join Norimono
					</h2>
					<p className="text-xs text-neutral-500 font-medium mt-0.5">
						Corporate Carpooling & Ridesharing
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
						<AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleNextFromStep1} className="space-y-3">
					{/* Full Name */}
					<div className="space-y-1">
						<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Full Name</label>
						<div className="relative">
							<input
								type="text"
								value={name}
								onChange={(e) => {
									const sanitized = e.target.value.replace(/[^a-zA-Z\s.'-]/g, '');
									setName(sanitized);
								}}
								pattern="[a-zA-Z\s.'-]+"
								maxLength={60}
								placeholder="Jane Doe"
								className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								required
							/>
							<User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
						</div>
					</div>

					{/* Corporate Email */}
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Corporate Email</label>
							{corporateDomain && (
								<span className="text-[10px] font-extrabold text-amber-700 bg-yellow-100 px-2 py-0.5 rounded-full flex items-center gap-1">
									<Building2 className="w-3 h-3 text-amber-600" /> @{corporateDomain}
								</span>
							)}
						</div>
						<div className="relative">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
								placeholder="e.g. name@tcs.com"
								className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								required
							/>
							<Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
						</div>
					</div>

					{/* Mobile Phone Number */}
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Mobile Phone Number</label>
							<span className="text-[9px] text-neutral-400 font-semibold">10-Digit Mobile Only</span>
						</div>
						<div className="relative">
							<input
								type="tel"
								inputMode="numeric"
								pattern="[0-9]*"
								maxLength={10}
								value={phone}
								onChange={(e) => {
									const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
									setPhone(digitsOnly);
								}}
								placeholder="9876543210"
								className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								required
							/>
							<Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
						</div>
					</div>

					{/* Organization & Gender */}
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Company</label>
							<select
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
							>
								<option value="TCS">TCS</option>
								<option value="Infosys">Infosys</option>
								<option value="Wipro">Wipro</option>
								<option value="Google">Google</option>
								<option value="Microsoft">Microsoft</option>
								<option value="Accenture">Accenture</option>
								<option value="Amazon">Amazon</option>
								<option value="Cognizant">Cognizant</option>
								<option value="Odoo">Odoo</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Gender (Safety Filter)</label>
							<select
								value={gender}
								onChange={(e) => setGender(e.target.value)}
								className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
							>
								<option value="female">Female</option>
								<option value="male">Male</option>
								<option value="other">Other</option>
							</select>
						</div>
					</div>

					{/* Designation & Department */}
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Designation</label>
							<input
								type="text"
								value={designation}
								onChange={(e) => setDesignation(e.target.value)}
								placeholder="e.g. Senior Architect"
								className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Department</label>
							<input
								type="text"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								placeholder="e.g. Technology"
								className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
							/>
						</div>
					</div>

					{/* Primary Commute Location in India with Auto-Detect GPS Button */}
					<div className="space-y-1.5 relative" ref={locationRef}>
						<div className="flex items-center justify-between">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
								<MapPin className="w-3.5 h-3.5 text-amber-600" />
								Office Commute Location (India Only)
							</label>
							<span className="text-[9px] font-bold text-black bg-yellow-100 border border-yellow-300 px-1.5 py-0.5 rounded flex items-center gap-1">
								🇮🇳 India Only
							</span>
						</div>

						{/* Phone-friendly input with Auto-Detect button */}
						<div className="flex items-stretch gap-1.5">
							<div className="relative flex-1">
								<input
									type="text"
									value={location}
									onChange={(e) => {
										setLocation(e.target.value);
										setLocationError("");
									}}
									onFocus={() => {
										if (locationSuggestions.length > 0) setShowLocationDropdown(true);
									}}
									placeholder="e.g. Indiranagar, Bengaluru or Hitec City, Hyderabad"
									className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>

							{/* Tactile Auto-Detect GPS Button */}
							<button
								type="button"
								onClick={handleAutoDetectLocation}
								disabled={isLocating}
								title="Auto-Detect My Current GPS Location"
								className="px-3 py-2 bg-black hover:bg-neutral-800 active:translate-y-0.5 text-yellow-400 font-black text-xs rounded-xl transition-all shadow-[0_3px_0_#262626] active:shadow-none flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 min-h-[38px]"
							>
								{isLocating ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
										<span className="hidden sm:inline text-[11px]">Locating...</span>
									</>
								) : (
									<>
										<Navigation className="w-4 h-4 text-yellow-400 fill-yellow-400" />
										<span className="text-[11px] font-black">Auto-Detect</span>
									</>
								)}
							</button>
						</div>

						{/* Location Error Warning if outside India or GPS denied */}
						{locationError && (
							<p className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5 animate-in fade-in">
								<AlertTriangle className="w-3 h-3 shrink-0" />
								<span>{locationError}</span>
							</p>
						)}

						{/* Mobile-Friendly Indian Tech Corridor Quick Pills */}
						<div className="flex items-center gap-1 overflow-x-auto pt-0.5 pb-0.5 no-scrollbar text-[10px]">
							<span className="text-neutral-400 text-[9px] uppercase font-bold shrink-0">Popular:</span>
							{["Bengaluru", "Hyderabad", "Pune", "Gurgaon", "Noida", "Mumbai", "Chennai"].map((city) => (
								<button
									key={city}
									type="button"
									onClick={() => {
										setLocation(`${city}, India`);
										setLocationError("");
										setShowLocationDropdown(false);
									}}
									className="px-2 py-0.5 bg-neutral-100 hover:bg-yellow-100 hover:text-black hover:border-yellow-400 text-neutral-700 border border-neutral-200 rounded-md whitespace-nowrap cursor-pointer transition-colors font-bold text-[10px]"
								>
									{city}
								</button>
							))}
						</div>

						{/* Autocomplete Dropdown */}
						{showLocationDropdown && locationSuggestions.length > 0 && (
							<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto py-1 animate-in fade-in duration-150">
								{locationSuggestions.map((item, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => {
											setLocation(item.fullAddress);
											setLocationCoords(item.coords);
											setShowLocationDropdown(false);
										}}
										className="w-full text-left px-3 py-2 text-xs hover:bg-yellow-50 transition-colors flex items-start gap-2 border-b border-neutral-100 last:border-b-0 cursor-pointer"
									>
										<MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
										<div className="min-w-0 flex-1">
											<span className="font-bold text-black block truncate">{item.title}</span>
											{item.subtitle && <span className="text-[10px] text-neutral-500 block truncate">{item.subtitle}</span>}
										</div>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Password & Confirm */}
					<div className="grid grid-cols-2 gap-2 pt-0.5">
						<div className="space-y-1">
							<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Password</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>
						</div>

						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Confirm</label>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="text-[10px] font-bold text-neutral-500 hover:text-black cursor-pointer"
								>
									{showPassword ? "Hide" : "Show"}
								</button>
							</div>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-xs focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
									required
								/>
								<Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
							</div>
						</div>
					</div>

					{/* Terms */}
					<div className="flex items-start gap-2 pt-0.5">
						<input
							type="checkbox"
							id="terms"
							checked={agreeTerms}
							onChange={(e) => setAgreeTerms(e.target.checked)}
							className="mt-0.5 w-3.5 h-3.5 text-yellow-500 rounded cursor-pointer accent-yellow-400"
						/>
						<label htmlFor="terms" className="text-[11px] text-neutral-600 leading-normal cursor-pointer select-none">
							I agree to the corporate <a href="#terms" className="font-bold text-black underline hover:text-amber-600">Commute Safety Policy</a>
						</label>
					</div>

					{/* Primary Submit Button */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all duration-150 transform active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_0_#CA8A04] active:shadow-none disabled:opacity-75 mt-2"
					>
						{isLoading ? (
							<div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
						) : (
							<>Create Norimono Account <ArrowRight className="w-4 h-4 stroke-[2.5]" /></>
						)}
					</button>
				</form>

				<div className="mt-5 pt-4 border-t border-neutral-100 text-center">
					<p className="text-xs text-neutral-500 font-medium">
						Already have an account?{" "}
						<button
							onClick={onSwitchToLogin}
							className="font-bold text-black underline underline-offset-2 hover:text-amber-600 ml-1 cursor-pointer transition-colors"
						>
							Log in here
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}

export default Signup;
