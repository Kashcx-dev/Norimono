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
		<div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row w-full page-transition relative overflow-hidden text-left">
			<AmbientBackground />

			{/* Left Panel: Content & Illustration (Yellow / Black / White 3D Corporate Tech Aesthetic) */}
			<div className="md:w-1/2 bg-zinc-950/95 backdrop-blur-2xl text-white p-8 md:p-14 flex flex-col justify-between relative overflow-hidden border-r border-zinc-800/80 z-10">
				{/* Background ambient glow orbs */}
				<div className="absolute top-0 -left-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
				<div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

				{/* Brand */}
				<div className="flex items-center gap-3 relative z-10">
					<div className="w-11 h-11 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_4px_20px_rgba(250,204,21,0.35)] border border-yellow-300">
						<Car className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
					</div>
					<div>
						<span className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
							Norimono <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 font-bold uppercase tracking-wider">乗り物</span>
						</span>
						<p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Dual-Engine Corporate Mobility</p>
					</div>
				</div>

				{/* Value Proposition */}
				<div className="my-auto py-10 space-y-7 relative z-10 max-w-lg">
					<div className="space-y-3">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/15 border border-yellow-400/30 rounded-full text-yellow-300 text-xs font-black uppercase tracking-widest shadow-sm">
							<Sparkles className="w-3.5 h-3.5 text-yellow-400" />
							<span>Enterprise White-Plate Mobility</span>
						</div>
						<h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
							Closed-Loop <span className="text-yellow-400 underline decoration-yellow-400/40 decoration-4 underline-offset-4">Corporate</span> Commuting.
						</h1>
						<p className="text-zinc-300 text-sm leading-relaxed">
							Connect exclusively with vetted coworkers and neighboring tech park peers. 
							Eliminating traffic gridlock, parking stress, and single-occupancy carbon emissions.
						</p>
					</div>

					{/* 3 Core Pillars (3D Elevated Cards) */}
					<div className="space-y-3.5 text-left">
						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-transform duration-200">
							<div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5 border border-yellow-400/30 shadow-inner">
								<ShieldCheck className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Corporate Email Authentication Wall
								</h3>
								<p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
									Strict corporate SSO verification (<span className="text-yellow-300 font-mono">name@tcs.com</span>). Zero strangers, 100% vetted colleagues.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-transform duration-200">
							<div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5 border border-white/20 shadow-inner">
								<Lock className="w-4 h-4 text-yellow-400" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Algorithmic Pricing & Zero-Cash Escrow
								</h3>
								<p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
									White-plate compliant cost-sharing locked by distance. In-app closed-loop wallet auto-settlement removes drop-off money awkwardness.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-transform duration-200">
							<div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5 border border-yellow-400/30 shadow-inner">
								<Zap className="w-4 h-4" />
							</div>
							<div>
								<h3 className="font-bold text-xs text-white">
									Engine 2: Guaranteed Commercial Backup
								</h3>
								<p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
									Eliminates carpool anxiety. If a coworker cancels, subsidized on-demand commercial cabs & bikes guarantee you are never stranded.
								</p>
							</div>
						</div>
					</div>

					{/* Partner Tech Hub Logos Strip */}
					<div className="pt-2">
						<div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-2.5">
							Trusted by employees across tech campuses:
						</div>
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="TCS">
								<CompanyLogos.TCS />
							</div>
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="Infosys">
								<CompanyLogos.Infosys />
							</div>
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="Wipro">
								<CompanyLogos.Wipro />
							</div>
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="Google">
								<CompanyLogos.Google />
							</div>
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="Microsoft">
								<CompanyLogos.Microsoft />
							</div>
							<div className="w-8 h-8 rounded-xl overflow-hidden border border-zinc-700 bg-white p-1 shadow-md hover:scale-105 transition-transform" title="Accenture">
								<CompanyLogos.Accenture />
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="relative z-10 text-zinc-400 text-[11px] flex justify-between items-center border-t border-zinc-800/80 pt-4">
					<span>© {new Date().getFullYear()} Norimono Technologies Inc.</span>
					<a
						href="/terms"
						target="_blank"
						rel="noreferrer"
						className="text-yellow-400 hover:text-yellow-300 font-bold hover:underline cursor-pointer"
					>
						Terms & Commute Charter ↗
					</a>
				</div>
			</div>

			{/* Right Panel: Auth Forms */}
			<div className="md:w-1/2 flex items-center justify-center p-6 md:p-10 z-10 overflow-y-auto max-h-screen bg-zinc-950">
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
					<div className="w-full max-w-md tactile-card-white p-8 text-center space-y-6">
						<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400 text-zinc-950 border border-yellow-300 shadow-[0_4px_16px_rgba(250,204,21,0.35)]">
							<CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
						</div>
						<div className="space-y-1.5">
							<h2 className="text-2xl font-black text-zinc-950">
								Welcome to Norimono
							</h2>
							<p className="text-xs text-zinc-500 font-medium">
								Your corporate credentials have been verified successfully.
							</p>
						</div>
						<button
							onClick={() => {
								setCurrentView("login");
								setUserProfile(null);
							}}
							className="w-full py-3 tactile-btn-yellow rounded-xl cursor-pointer text-xs uppercase tracking-wider"
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
