import React, { useState } from "react";
import Login from "./Login";
import Signup from "./signup";
import { Car, Users, Leaf, ShieldCheck, CheckCircle2, Zap, Lock, Sparkles, Building2 } from "lucide-react";
import { CompanyLogos } from "../utils/companyBadges";
import AmbientBackground from "./AmbientBackground";

function AuthPortal({ onLoginSuccess }) {
	const [currentView, setCurrentView] = useState("login"); // 'login', 'signup', 'success'
	const [userProfile, setUserProfile] = useState(null);

	const handleLogin = (profile) => {
		setUserProfile(profile);
		setCurrentView("success");
		onLoginSuccess?.(profile);
	};

	const handleSignup = (profile) => {
		setUserProfile(profile);
		setCurrentView("success");
		onLoginSuccess?.(profile);
	};

	return (
		<div className="min-h-screen bg-slate-950 flex flex-col md:flex-row w-full page-transition relative overflow-hidden">
			<AmbientBackground />

			{/* Left Panel: Content & Illustration (Corporate Tech Aesthetic) */}
			<div className="md:w-1/2 bg-slate-900/90 backdrop-blur-xl text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800 z-10">
				{/* Background glow orbs */}
				<div className="absolute top-0 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

				{/* Brand */}
				<div className="flex items-center gap-3 relative z-10">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
						<Car className="w-5 h-5 text-slate-950" />
					</div>
					<div>
						<span className="text-xl font-black tracking-tight text-white">
							Norimono
						</span>
						<p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">Dual-Engine Mobility</p>
					</div>
				</div>

				{/* Value Proposition */}
				<div className="my-auto py-10 space-y-7 relative z-10 max-w-lg">
					<div className="space-y-3">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/15 border border-teal-500/30 rounded-full text-teal-300 text-xs font-extrabold uppercase tracking-widest">
							<Sparkles className="w-3.5 h-3.5" />
							<span>The Verification Wall</span>
						</div>
						<h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
							Closed-Loop Corporate Commuting.
						</h1>
						<p className="text-slate-300 text-sm leading-relaxed">
							Connect exclusively with vetted coworkers and neighboring tech park peers. 
							Eliminating traffic congestion, parking shortages, and carbon footprints with guaranteed reliability.
						</p>
					</div>

					{/* 3 Core Pillars */}
					<div className="space-y-4 text-left">
						<div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
							<div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-500/30">
								<ShieldCheck className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Work Email Authentication Wall
								</h3>
								<p className="text-[11px] text-slate-400 leading-snug mt-0.5">
									Strict corporate email SSO verification (<span className="text-teal-300 font-mono">name@tcs.com</span>). Zero strangers, 100% vetted colleagues.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
							<div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/30">
								<Lock className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Algorithmic Pricing & Zero-Cash
								</h3>
								<p className="text-[11px] text-slate-400 leading-snug mt-0.5">
									White-plate compliant cost-sharing locked by distance. In-app wallet auto-settlement removes drop-off money awkwardness.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-xs">
							<div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
								<Zap className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Engine 2: Commercial Backup
								</h3>
								<p className="text-[11px] text-slate-400 leading-snug mt-0.5">
									Eliminates carpool anxiety. If a coworker cancels, on-demand cabs & bikes guarantee no one is ever stranded.
								</p>
							</div>
						</div>
					</div>

					{/* Partner Tech Hub Logos Strip */}
					<div className="pt-2">
						<div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2.5">
							Trusted by employees from:
						</div>
						<div className="flex items-center gap-3">
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="TCS">
								<CompanyLogos.TCS />
							</div>
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="Infosys">
								<CompanyLogos.Infosys />
							</div>
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="Wipro">
								<CompanyLogos.Wipro />
							</div>
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="Google">
								<CompanyLogos.Google />
							</div>
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="Microsoft">
								<CompanyLogos.Microsoft />
							</div>
							<div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 bg-white p-0.5" title="Accenture">
								<CompanyLogos.Accenture />
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="relative z-10 text-slate-500 text-[11px] flex justify-between items-center border-t border-slate-800 pt-4">
					<span>© {new Date().getFullYear()} Norimono Technologies Inc.</span>
					<span className="text-teal-400 font-semibold">100% Non-Profit Cost Sharing Compliant</span>
				</div>
			</div>

			{/* Right Panel: Auth Forms */}
			<div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 z-10">
				{currentView === "login" && (
					<Login
						onSwitchToSignup={() => setCurrentView("signup")}
						onLoginSuccess={handleLogin}
					/>
				)}

				{currentView === "signup" && (
					<Signup
						onSwitchToLogin={() => setCurrentView("login")}
						onSignupSuccess={handleSignup}
					/>
				)}

				{currentView === "success" && (
					<div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 text-center space-y-6">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 shadow-inner">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<div className="space-y-1.5">
							<h2 className="text-2xl font-black text-slate-900">
								Welcome to Norimono
							</h2>
							<p className="text-xs text-slate-500">
								Your corporate credentials have been verified successfully.
							</p>
						</div>
						<button
							onClick={() => {
								setCurrentView("login");
								setUserProfile(null);
							}}
							className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
						>
							Proceed to Dashboard
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default AuthPortal;
