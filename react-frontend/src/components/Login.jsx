import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Car, Eye, EyeOff, Shield, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { getCompanyInfo } from "../utils/companyBadges";

function Login({ onSwitchToSignup, onLoginSuccess }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [organization, setOrganization] = useState("TCS");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	// Dynamic Company Info derived from Email
	const detectedCompany = getCompanyInfo(email);
	const DetectedLogo = detectedCompany.Logo;

	useEffect(() => {
		if (email && email.includes("@")) {
			const info = getCompanyInfo(email);
			if (info && info.shortName && info.shortName !== "CORP") {
				setOrganization(info.shortName);
			}
		}
	}, [email]);

	// OTP State
	const [showOtp, setShowOtp] = useState(false);
	const [otp, setOtp] = useState("");
	const [resolvedEmail, setResolvedEmail] = useState("");

	const handleSubmit = (e) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("Please fill in all fields");
			return;
		}

		if (!email.includes("@") || !email.includes(".")) {
			setError("Please enter a valid corporate email");
			return;
		}

		setIsLoading(true);
		fetch("/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, organization }),
		})
			.then((res) => {
				if (!res.ok) {
					return res.json().then((data) => {
						throw new Error(
							data.message || data.error || "Failed to log in",
						);
					});
				}
				return res.json();
			})
			.then((data) => {
				setIsLoading(false);
				if (data.requires2FA) {
					setShowOtp(true);
					setResolvedEmail(data.resolvedEmail || email);
					if (data.devOtp) setOtp(data.devOtp);
				} else if (data.token) {
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					onLoginSuccess?.({ ...data.user, organization });
				}
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message || "Something went wrong. Please try again.");
			});
	};

	const handleOtpSubmit = (e) => {
		e.preventDefault();
		setError("");
		if (!otp) {
			setError("Please enter the OTP");
			return;
		}

		setIsLoading(true);
		fetch("/auth/verify-otp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: resolvedEmail, otp }),
		})
			.then((res) => {
				if (!res.ok) {
					return res.json().then((data) => {
						throw new Error(data.message || "Invalid OTP");
					});
				}
				return res.json();
			})
			.then((data) => {
				setIsLoading(false);
				if (data.token) {
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					onLoginSuccess?.({ ...data.user, organization });
				}
			})
			.catch((err) => {
				setIsLoading(false);
				setError(err.message || "Invalid OTP. Please try again.");
			});
	};

	return (
		<div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] border border-black/10 overflow-hidden transition-all duration-300">
			{/* Top Yellow Accent Bar */}
			<div className="h-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"></div>

			<div className="p-8">
				<div className="text-center mb-7">
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-400 text-black mb-3 shadow-[0_6px_16px_rgba(250,204,21,0.4)] border border-yellow-500/30">
						<Car className="w-7 h-7" />
					</div>
					<h2 className="text-2xl font-black text-black tracking-tight">
						Welcome to Norimono
					</h2>
					<p className="text-xs text-neutral-500 font-medium mt-1">
						Enterprise Carpooling & Verified Mobility
					</p>
				</div>

				{!showOtp ? (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
								<span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
								{error}
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
								<span>Verified Partner Company</span>
								{email.includes("@") && (
									<span className="text-[10px] text-amber-700 font-extrabold flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded-full">
										<ShieldCheck className="w-3 h-3 text-amber-600" /> Auto-Detected
									</span>
								)}
							</label>
							<div className="relative">
								<select
									value={organization}
									onChange={(e) => setOrganization(e.target.value)}
									className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all appearance-none cursor-pointer font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								>
									<option value="TCS">Tata Consultancy Services (TCS)</option>
									<option value="Infosys">Infosys Technologies</option>
									<option value="Wipro">Wipro Technologies</option>
									<option value="Google">Google India</option>
									<option value="Microsoft">Microsoft India</option>
									<option value="Accenture">Accenture India</option>
									<option value="Amazon">Amazon India</option>
									<option value="Cognizant">Cognizant</option>
									<option value="Odoo">Odoo India</option>
								</select>
								<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
									<Building2 className="w-4 h-4" />
								</div>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
								Official Work Email
							</label>
							<div className="relative">
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
									placeholder="e.g. name@tcs.com"
									className="w-full pl-11 pr-12 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder:text-neutral-400 font-medium font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
									<Mail className="w-4 h-4" />
								</div>
								{email.includes("@") && detectedCompany.shortName !== "CORP" && (
									<div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md overflow-hidden p-0.5 border border-neutral-200 bg-white shadow-xs">
										<DetectedLogo />
									</div>
								)}
							</div>
						</div>

						<div className="space-y-1.5">
							<div className="flex justify-between items-center">
								<label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
									Password
								</label>
							</div>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full pl-11 pr-11 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-black text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder:text-neutral-400 font-medium shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
								/>
								<div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
									<Lock className="w-4 h-4" />
								</div>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						{/* Tactile 3D Yellow Submit Button */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all duration-150 transform active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-[0_4px_0_#CA8A04] active:shadow-none cursor-pointer mt-2"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
							) : (
								<>
									Sign In <ArrowRight className="w-4 h-4 stroke-[2.5]" />
								</>
							)}
						</button>

						{/* 1-Tap Demo Logins for Reviewers / Evaluators */}
						<div className="pt-3 border-t border-neutral-100">
							<div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">
								<span>1-Tap Demo Accounts:</span>
								<span className="text-amber-700 font-mono bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">Pass: Norimono@2026</span>
							</div>
							<div className="grid grid-cols-3 gap-2">
								<button
									type="button"
									onClick={() => {
										setEmail("ananya.s@tcs.com");
										setPassword("Norimono@2026");
									}}
									className="px-2.5 py-2 bg-white hover:bg-yellow-50/70 text-black border-2 border-neutral-200 hover:border-yellow-400 rounded-xl text-center font-bold text-[11px] shadow-[0_3px_0_rgba(0,0,0,0.06)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
								>
									🚗 TCS Driver
								</button>
								<button
									type="button"
									onClick={() => {
										setEmail("rohan.k@infosys.com");
										setPassword("Norimono@2026");
									}}
									className="px-2.5 py-2 bg-white hover:bg-yellow-50/70 text-black border-2 border-neutral-200 hover:border-yellow-400 rounded-xl text-center font-bold text-[11px] shadow-[0_3px_0_rgba(0,0,0,0.06)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
								>
									🎒 Infosys Rider
								</button>
								<button
									type="button"
									onClick={() => {
										setEmail("admin@norimono.com");
										setPassword("Norimono@2026");
									}}
									className="px-2.5 py-2 bg-white hover:bg-yellow-50/70 text-black border-2 border-neutral-200 hover:border-yellow-400 rounded-xl text-center font-bold text-[11px] shadow-[0_3px_0_rgba(0,0,0,0.06)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
								>
									🛡️ Admin
								</button>
							</div>
						</div>
					</form>
				) : (
					<form
						onSubmit={handleOtpSubmit}
						className="space-y-4 animate-fade-in"
					>
						<div className="text-center mb-5">
							<h3 className="text-lg font-black text-black">
								Check your email
							</h3>
							<p className="text-xs text-neutral-500 mt-1">
								We sent a 6-digit code to <strong className="text-black">{resolvedEmail}</strong>
							</p>
						</div>

						{error && (
							<div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 font-medium">
								<span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
								{error}
							</div>
						)}

						<div className="space-y-1.5">
							<label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
								Verification Code
							</label>
							<input
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								value={otp}
								onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
								placeholder="000000"
								className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-center tracking-[0.5em] text-2xl font-black text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
								maxLength={6}
							/>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm rounded-xl transition-all duration-150 transform active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none shadow-[0_4px_0_#CA8A04] active:shadow-none cursor-pointer"
						>
							{isLoading ? (
								<div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
							) : (
								<>
									Verify & Continue <ArrowRight className="w-4 h-4 stroke-[2.5]" />
								</>
							)}
						</button>

						<button
							type="button"
							onClick={() => setShowOtp(false)}
							className="w-full py-2 text-xs text-neutral-500 hover:text-black font-bold transition-colors cursor-pointer"
						>
							← Back to Login
						</button>
					</form>
				)}

				{!showOtp && (
					<div className="mt-6 pt-5 border-t border-neutral-100 text-center">
						<p className="text-xs text-neutral-500 font-medium">
							New to Norimono?{" "}
							<button
								onClick={onSwitchToSignup}
								className="font-bold text-black hover:text-amber-600 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
							>
								Create an account
							</button>
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default Login;
