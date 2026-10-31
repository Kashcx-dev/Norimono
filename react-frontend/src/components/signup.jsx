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
	KeyRound
} from "lucide-react";
import vehicleCatalog from "../data/vehicle_catalog.json";
import { io } from "socket.io-client";
import { getCompanyInfo } from "../utils/companyBadges";

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
		if (!password) return setError("Please create a password.");
		if (password !== confirmPassword) return setError("Passwords do not match.");
		if (!agreeTerms) return setError("Please agree to the Terms of Service & Corporate Commute Policy.");

		if (riderType === "rider") {
			// Advance to Page 2 (Driver Credentials)
			setCurrentStep(2);
		} else {
			// Passenger can directly request OTP
			triggerSignupOtp();
		}
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
			<div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-300">
				{/* Top Status Gradient Bar */}
				<div className={`h-2.5 ${isApprovedLive ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 via-purple-600 to-[#714B67]'}`}></div>

				<div className="p-8 sm:p-10 space-y-6">
					{isApprovedLive ? (
						<div className="text-center space-y-3">
							<div className="inline-flex items-center justify-center w-18 h-18 rounded-full bg-emerald-100 text-emerald-600 shadow-sm animate-bounce">
								<CheckCircle2 className="w-10 h-10" />
							</div>
							<h2 className="text-2xl font-black text-gray-900 tracking-tight">
								Driver Credentials Approved!
							</h2>
							<p className="text-sm text-gray-600 max-w-sm mx-auto">
								Welcome aboard, <strong className="text-gray-900">{registeredUserData?.name}</strong>! Your vehicle and DL credentials have been verified by your enterprise administrator.
							</p>
						</div>
					) : (
						<div className="text-center space-y-3">
							<div className="relative inline-flex items-center justify-center w-18 h-18 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shadow-xs">
								<Clock className="w-9 h-9 animate-pulse" />
								<span className="absolute -top-1 -right-1 flex h-4 w-4">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
								</span>
							</div>
							<h2 className="text-2xl font-black text-gray-900 tracking-tight">
								Driver Application Under Review
							</h2>
							<p className="text-sm text-gray-600 max-w-sm mx-auto">
								Your driver registration has been submitted to the safety & mobility team. Applications are typically verified in a few minutes.
							</p>
						</div>
					)}

					{/* Application Summary Card */}
					<div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-3.5">
						<div className="flex items-center justify-between border-b border-gray-200 pb-3">
							<div className="flex items-center gap-2">
								<Car className="w-4 h-4 text-[#714B67]" />
								<span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Submitted Credentials</span>
							</div>
							<span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
								isApprovedLive 
									? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
									: 'bg-amber-100 text-amber-800 border border-amber-200'
							}`}>
								<span className={`w-1.5 h-1.5 rounded-full ${isApprovedLive ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`}></span>
								{isApprovedLive ? 'Approved' : 'Pending Review'}
							</span>
						</div>

						<div className="grid grid-cols-2 gap-3 text-xs">
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">Driver Name</span>
								<span className="font-bold text-gray-800">{registeredUserData?.name || name}</span>
							</div>
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">Organization</span>
								<span className="font-bold text-gray-800">{organization}</span>
							</div>
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">Vehicle Model</span>
								<span className="font-bold text-gray-800 truncate block">
									{verificationData?.vehicle_model || vehicleModel || modelSearch}
								</span>
							</div>
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">License Plate</span>
								<span className="font-mono font-bold text-gray-800">
									{verificationData?.vehicle_no || vehicleNo}
								</span>
							</div>
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">Driving License</span>
								<span className="font-mono font-bold text-gray-800">{verificationData?.dl_no || dlNo}</span>
							</div>
							<div>
								<span className="text-gray-400 font-semibold block text-[10px] uppercase">Seating Capacity</span>
								<span className="font-bold text-gray-800">{verificationData?.seating_capacity || seatingCapacity} Seats</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="space-y-3 pt-2">
						{isApprovedLive ? (
							<button
								onClick={() => onSignupSuccess?.({ ...registeredUserData, is_vehicle_registered: "2", organization })}
								className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
							>
								<span>Start Offering Rides as Driver</span>
								<ArrowRight className="w-4 h-4" />
							</button>
						) : (
							<>
								<button
									onClick={() => onSignupSuccess?.({ ...registeredUserData, is_vehicle_registered: "1", organization })}
									className="w-full py-3.5 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
								>
									<span>Continue to Dashboard as Passenger</span>
									<ArrowRight className="w-4 h-4" />
								</button>
								<div className="flex items-center justify-center">
									<button
										onClick={handleCheckStatus}
										disabled={checkingStatus}
										className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
									>
										<RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin text-[#714B67]' : ''}`} />
										<span>{checkingStatus ? 'Checking with safety queue...' : 'Check Approval Status'}</span>
									</button>
								</div>
							</>
						)}
					</div>

					{/* Compliance Hint */}
					<div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
						<Shield className="w-4 h-4 text-[#714B67] shrink-0 mt-0.5" />
						<p className="text-[11px] leading-relaxed text-purple-800">
							<strong>Norimono Safety Assurance:</strong> Only verified corporate personnel can publish rides. Passengers can verify your plate and DL in their trip view.
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
			<div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-left animate-in fade-in duration-200">
				<div className="h-2 bg-[#714B67]"></div>
				<div className="p-8">
					<div className="text-center mb-6">
						<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#714B67]/10 text-[#714B67] mb-3">
							<KeyRound className="w-6 h-6" />
						</div>
						<h3 className="text-xl font-bold text-gray-900">Verify Your Corporate Email</h3>
						<p className="text-xs text-gray-500 mt-1">We sent a 6-digit verification code to <strong>{email}</strong></p>
					</div>

					{error && (
						<div className="mb-4 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleVerifyOtp} className="space-y-4">
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
								6-Digit OTP Code
							</label>
							<input
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder="000000"
								maxLength={6}
								className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-[0.5em] text-2xl font-black text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
							/>
						</div>

						{devOtpHint && (
							<div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
								<span className="text-emerald-700 font-medium">Dev Test Code: <strong className="font-mono">{devOtpHint}</strong></span>
								<button
									type="button"
									onClick={() => setOtp(devOtpHint)}
									className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-emerald-700"
								>
									Auto Fill
								</button>
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							) : (
								<>Verify & Finalize Registration <ArrowRight className="w-4 h-4" /></>
							)}
						</button>

						<button
							type="button"
							onClick={() => setCurrentStep(riderType === "rider" ? 2 : 1)}
							className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
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
			<div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-left animate-in fade-in slide-in-from-right-4 duration-300">
				<div className="h-2 bg-[#714B67]"></div>

				<div className="p-7 sm:p-9">
					{/* Progress Header */}
					<div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-4">
						<div>
							<span className="text-[10px] font-extrabold uppercase tracking-widest text-[#714B67] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
								Step 2 of 2: Driver Verification
							</span>
							<h2 className="text-xl font-bold text-gray-900 mt-1">
								Vehicle & License Information
							</h2>
						</div>
						<div className="w-9 h-9 rounded-xl bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
							<Car className="w-5 h-5" />
						</div>
					</div>

					{error && (
						<div className="mb-4 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 animate-shake">
							<AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmitStep2} className="space-y-4">
						{/* DL Number */}
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider flex items-center justify-between">
								<span>Driver's License Number *</span>
								<span className="text-gray-400 font-normal">State Issued</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={dlNo}
									onChange={(e) => setDlNo(e.target.value.toUpperCase())}
									placeholder="e.g. DL-0420110012345"
									className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									required
								/>
								<FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							</div>
						</div>

						{/* Searchable Vehicle Model from Catalog */}
						<div className="space-y-1 relative" ref={modelInputRef}>
							<label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider flex items-center justify-between">
								<span>Vehicle Make & Model *</span>
								<span className="text-gray-400 font-normal">Select or Type</span>
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
									className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									required
								/>
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							</div>

							{/* Suggestions dropdown */}
							{showModelDropdown && modelSuggestions.length > 0 && (
								<div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
									{modelSuggestions.map((item, idx) => (
										<div
											key={idx}
											onMouseDown={() => handleSelectModel(item)}
											className="p-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition-colors text-xs"
										>
											<div className="flex items-center gap-2">
												<Car className="w-3.5 h-3.5 text-[#714B67]" />
												<span className="font-semibold text-gray-800">{item.name}</span>
											</div>
											<div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
												<span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.fuel_type}</span>
												<span className="bg-purple-50 text-[#714B67] px-1.5 py-0.5 rounded font-bold">{item.seats} Seats</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Vehicle Registration Plate Number */}
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider flex items-center justify-between">
								<span>Vehicle Plate / Reg No. *</span>
								<span className="text-gray-400 font-normal">State Format</span>
							</label>
							<div className="relative">
								<input
									type="text"
									value={vehicleNo}
									onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
									placeholder="e.g. WB-02-AB-1234 or DL-01-A-1234"
									className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									required
								/>
								<Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							</div>
						</div>

						{/* Seats & Fuel Ratio */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">
									Available Passenger Seats
								</label>
								<select
									value={seatingCapacity}
									onChange={(e) => setSeatingCapacity(parseInt(e.target.value, 10))}
									className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								>
									<option value={1}>1 Passenger Seat</option>
									<option value={2}>2 Passenger Seats</option>
									<option value={3}>3 Passenger Seats</option>
									<option value={4}>4 Passenger Seats (Standard)</option>
									<option value={5}>5 Passenger Seats</option>
									<option value={6}>6 Passenger Seats (SUV/MUV)</option>
									<option value={7}>7 Passenger Seats</option>
								</select>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">
									Insurance Policy No.
								</label>
								<input
									type="text"
									value={insuranceNo}
									onChange={(e) => setInsuranceNo(e.target.value.toUpperCase())}
									placeholder="e.g. POL-12345678"
									className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								/>
							</div>
						</div>

						{/* Notice */}
						<div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px] text-gray-600 flex items-start gap-2">
							<Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
							<p className="leading-tight">
								By submitting, your vehicle will enter the <strong>Corporate Verification Queue</strong>. Admin approval is required before you can publish rides.
							</p>
						</div>

						{/* Stepper Buttons */}
						<div className="flex items-center gap-3 pt-2">
							<button
								type="button"
								onClick={() => setCurrentStep(1)}
								className="w-1/3 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
							>
								<ArrowLeft className="w-3.5 h-3.5" /> Back
							</button>

							<button
								type="submit"
								disabled={isLoading}
								className="w-2/3 py-2.5 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								) : (
									<>Submit & Verify Email <ArrowRight className="w-3.5 h-3.5" /></>
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
		<div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden text-left transition-all duration-300 hover:shadow-2xl">
			<div className="h-2 bg-[#714B67]"></div>

			<div className="p-7 sm:p-8">
				<div className="text-center mb-5">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#714B67]/10 text-[#714B67] mb-2">
						<Car className="w-6 h-6" />
					</div>
					<h2 className="text-2xl font-bold text-gray-900 tracking-tight">
						Join Norimono
					</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Corporate Carpooling & Ridesharing
					</p>
				</div>

				{error && (
					<div className="mb-4 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 animate-shake">
						<AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
						<span>{error}</span>
					</div>
				)}

				<form onSubmit={handleNextFromStep1} className="space-y-3.5">
					{/* Full Name */}
					<div className="space-y-1">
						<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Full Name</label>
						<div className="relative">
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Jane Doe"
								className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
								required
							/>
							<User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
						</div>
					</div>

					{/* Corporate Email & Domain Auto-detection */}
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Official Corporate Email</label>
							{corporateDomain && (
								<span className="text-[10px] font-bold text-teal-600 flex items-center gap-1">
									<Building2 className="w-3 h-3" /> @{corporateDomain}
								</span>
							)}
						</div>
						<div className="relative">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="e.g. name@tcs.com"
								className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
								required
							/>
							<Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						</div>
					</div>

					{/* Organization & Gender */}
					<div className="grid grid-cols-2 gap-2.5">
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Company</label>
							<select
								value={organization}
								onChange={(e) => setOrganization(e.target.value)}
								className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
							<label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Gender (Safety Filter)</label>
							<select
								value={gender}
								onChange={(e) => setGender(e.target.value)}
								className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
							>
								<option value="female">Female</option>
								<option value="male">Male</option>
								<option value="other">Other</option>
							</select>
						</div>
					</div>

					{/* Designation & Department */}
					<div className="grid grid-cols-2 gap-2.5">
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Designation</label>
							<input
								type="text"
								value={designation}
								onChange={(e) => setDesignation(e.target.value)}
								placeholder="e.g. Senior Cloud Architect"
								className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
							/>
						</div>

						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Department</label>
							<input
								type="text"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								placeholder="e.g. Technology"
								className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
							/>
						</div>
					</div>

					{/* Role Selection: Passenger vs Rider (TWO OPTIONS) */}
					<div className="space-y-1.5 pt-1">
						<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
							I am joining Norimono as:
						</label>
						<div className="grid grid-cols-2 gap-2.5">
							{/* Passenger Card */}
							<div
								onClick={() => setRiderType("passenger")}
								className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative ${
									riderType === "passenger"
										? "border-[#00A09D] bg-teal-50/60 shadow-xs"
										: "border-gray-200 bg-white hover:border-gray-300"
								}`}
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-base">🚶‍♂️</span>
									{riderType === "passenger" && (
										<CheckCircle2 className="w-4 h-4 text-[#00A09D]" />
									)}
								</div>
								<p className="text-xs font-bold text-gray-900">Passenger</p>
								<p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
									Find & book shared rides to office.
								</p>
							</div>

							{/* Rider / Driver Card */}
							<div
								onClick={() => setRiderType("rider")}
								className={`p-3 rounded-xl border-2 transition-all cursor-pointer relative ${
									riderType === "rider"
										? "border-[#714B67] bg-purple-50/60 shadow-xs"
										: "border-gray-200 bg-white hover:border-gray-300"
								}`}
							>
								<div className="flex items-center justify-between mb-1">
									<span className="text-base">🚗</span>
									{riderType === "rider" && (
										<CheckCircle2 className="w-4 h-4 text-[#714B67]" />
									)}
								</div>
								<p className="text-xs font-bold text-gray-900">Rider / Driver</p>
								<p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
									Offer seats in my car & offset fuel.
								</p>
							</div>
						</div>
					</div>

					{/* Password & Confirm */}
					<div className="grid grid-cols-2 gap-2.5 pt-1">
						<div className="space-y-1">
							<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Password</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									required
								/>
								<Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
							</div>
						</div>

						<div className="space-y-1">
							<div className="flex justify-between items-center">
								<label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Confirm</label>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="text-[10px] font-semibold text-[#00A09D] hover:underline cursor-pointer"
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
									className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67]"
									required
								/>
								<Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
							</div>
						</div>
					</div>

					{/* Terms */}
					<div className="flex items-start gap-2 pt-1">
						<input
							type="checkbox"
							id="terms"
							checked={agreeTerms}
							onChange={(e) => setAgreeTerms(e.target.checked)}
							className="mt-0.5 w-3.5 h-3.5 text-[#714B67] rounded cursor-pointer"
						/>
						<label htmlFor="terms" className="text-[11px] text-gray-500 leading-normal cursor-pointer select-none">
							I agree to the corporate <a href="#terms" className="font-semibold text-[#00A09D] hover:underline">Commute Safety Policy</a>
						</label>
					</div>

					{/* Primary Submit Button */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full py-3 px-4 bg-[#714B67] hover:bg-[#5c3c54] text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-75"
					>
						{isLoading ? (
							<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
						) : riderType === "rider" ? (
							<>Continue to Driver Verification (Step 2) <ArrowRight className="w-4 h-4" /></>
						) : (
							<>Register as Passenger <ArrowRight className="w-4 h-4" /></>
						)}
					</button>
				</form>

				<div className="mt-5 pt-4 border-t border-gray-100 text-center">
					<p className="text-xs text-gray-500">
						Already have an account?{" "}
						<button
							onClick={onSwitchToLogin}
							className="font-bold text-[#00A09D] hover:underline ml-1 cursor-pointer"
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
