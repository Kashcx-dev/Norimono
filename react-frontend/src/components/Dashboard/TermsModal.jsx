import React, { useState } from "react";
import {
	X,
	ShieldCheck,
	Scale,
	Wallet,
	Lock,
	Users,
	FileText,
	CheckCircle2,
	AlertCircle,
	Car,
	ExternalLink,
	Sparkles,
	Building2
} from "lucide-react";

function TermsModal({ isOpen, onClose, standalone = false }) {
	const [activeSection, setActiveSection] = useState("whiteplate");

	if (!isOpen && !standalone) return null;

	const sections = [
		{
			id: "whiteplate",
			label: "1. White-Plate Legal Compliance",
			icon: Scale
		},
		{
			id: "pricing",
			label: "2. Algorithmic Fuel Cost Split",
			icon: Sparkles
		},
		{
			id: "wallet",
			label: "3. Closed-Loop Wallet Policy",
			icon: Wallet
		},
		{
			id: "identity",
			label: "4. Corporate Identity & Gating",
			icon: Building2
		},
		{
			id: "safety",
			label: "5. Safety, OTP & Dual Ratings",
			icon: ShieldCheck
		},
		{
			id: "etiquette",
			label: "6. Cabin Amenities & BlaBlaCar Code",
			icon: Users
		}
	];

	const content = (
		<div className="flex flex-col md:flex-row h-full max-h-[85vh] text-slate-800">
			{/* Sidebar navigation */}
			<div className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 border-r border-slate-800 flex flex-col justify-between shrink-0">
				<div>
					<div className="flex items-center gap-2 mb-6 px-2">
						<div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
							<Scale className="w-4 h-4" />
						</div>
						<div>
							<h3 className="text-sm font-bold text-white tracking-tight">Legal & Commute Charter</h3>
							<p className="text-[10px] text-teal-400 font-mono">Ver 2.4 • White-Plate</p>
						</div>
					</div>

					<nav className="space-y-1">
						{sections.map((sec) => {
							const Icon = sec.icon;
							const isActive = activeSection === sec.id;
							return (
								<button
									key={sec.id}
									onClick={() => setActiveSection(sec.id)}
									className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
										isActive
											? "bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
											: "text-slate-400 hover:text-white hover:bg-slate-800/60"
									}`}
								>
									<Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
									<span className="truncate">{sec.label}</span>
								</button>
							);
						})}
					</nav>
				</div>

				<div className="pt-4 border-t border-slate-800/80 px-2 text-[10px] text-slate-400 space-y-1">
					<div className="flex items-center gap-1.5 text-teal-400 font-bold">
						<ShieldCheck className="w-3.5 h-3.5" />
						<span>MVA Sec 66 & 192A Mandate</span>
					</div>
					<p className="leading-tight text-slate-400">
						Strictly non-commercial colleague ridesharing within corporate campuses.
					</p>
				</div>
			</div>

			{/* Main Content Area */}
			<div className="flex-1 p-6 overflow-y-auto bg-slate-50/60 space-y-6">
				{activeSection === "whiteplate" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Statutory Framework
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								1. White-Plate Private Vehicle Non-Commercial Compliance
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Strict compliance with Section 66 and Section 192A of the Motor Vehicles Act, 1988 (India).
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<p>
								<strong>Norimono</strong> operates strictly as a peer-to-peer corporate expense-splitting network for employees of verified enterprise organizations. White-plate private vehicles registered on Norimono are strictly barred from commercial passenger transport operations.
							</p>

							<div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-amber-900">
								<div className="flex items-center gap-2 font-bold text-xs text-amber-800">
									<AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
									<span>Prohibition of Commercial Taxi Fares & Driver Profits</span>
								</div>
								<p className="text-[11px] leading-relaxed text-amber-800">
									Under transport guidelines, private car owners are legally permitted to share actual fuel and operational expenses on personal commutes. Drivers are strictly prohibited from generating commercial profit, surge-pricing rides, or bargaining fares with colleagues.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
										What Is Permitted
									</span>
									<ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
										<li>Non-profit pro-rata fuel cost split.</li>
										<li>Verified coworker rides along regular office routes.</li>
										<li>Corporate green commute ESG travel subsidies.</li>
										<li>Automated zero-cash wallet settlement.</li>
									</ul>
								</div>
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
										Strictly Prohibited
									</span>
									<ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
										<li>Manual fare negotiations or cash collection.</li>
										<li>Commercial taxi-meter operations or surge pricing.</li>
										<li>Accepting public, unverified outside passengers.</li>
										<li>Using yellow-plate commercial cabs for P2P cost-sharing.</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeSection === "pricing" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Algorithmic Transparency
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								2. The Certified Algorithmic Pricing Formula
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Mathematical breakdown determining 100% legal, non-negotiable cost split.
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<p>
								To eliminate fare exploitation, the Norimono backend strictly calculates and locks all ride fares using verified Open Source Routing Machine (OSRM) driving road telemetry and certified vehicle consumption ratios. Drivers cannot manually alter this price.
							</p>

							{/* Formula Box */}
							<div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono">
								<span className="text-[10px] uppercase font-bold text-teal-400 block tracking-wider">
									Server-Side Cost Calculation Engine
								</span>

								<div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
									<div className="text-teal-300 font-bold">
										1. Total Trip Fuel Burn:
									</div>
									<div className="pl-3 text-slate-300">
										TotalFuel = Distance_OSRM(km) × BaselineFuelRate(₹/km) × CertifiedFuelRatio
									</div>

									<div className="text-teal-300 font-bold pt-1">
										2. Pro-Rata Cost Share per Seat:
									</div>
									<div className="pl-3 text-slate-300">
										GrossSharePerSeat = round( TotalFuel ÷ OfferedSeats )
									</div>

									<div className="text-teal-300 font-bold pt-1">
										3. Net Colleague Commute Fare:
									</div>
									<div className="pl-3 text-slate-300">
										ColleagueFare = GrossSharePerSeat − OrgGreenCommuteSubsidy
									</div>
								</div>
							</div>

							<div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2">
								<span className="font-bold text-slate-900 text-xs block">
									Concrete Numerical Demonstration:
								</span>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
									<div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
										<span className="text-slate-400 block text-[9px] uppercase font-bold">OSRM Route</span>
										<span className="font-bold text-slate-800 font-mono">14.55 km</span>
									</div>
									<div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
										<span className="text-slate-400 block text-[9px] uppercase font-bold">Certified Burn</span>
										<span className="font-bold text-slate-800 font-mono">0.95x ratio</span>
									</div>
									<div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
										<span className="text-slate-400 block text-[9px] uppercase font-bold">Total Fuel Cost</span>
										<span className="font-bold text-slate-800 font-mono">₹76.02</span>
									</div>
									<div className="bg-teal-50 p-2 rounded-lg border border-teal-100">
										<span className="text-teal-700 block text-[9px] uppercase font-bold">Colleague Pays</span>
										<span className="font-bold text-teal-800 font-mono">₹15.00 / seat</span>
									</div>
								</div>
								<p className="text-[10px] text-slate-500 pt-1">
									* Note: The vehicle owner driver receives the pro-rata gross cost share (Colleague Fare + Company Green Subsidy), fully covering verified operational fuel split with zero profit margin.
								</p>
							</div>
						</div>
					</div>
				)}

				{activeSection === "wallet" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Fiscal Policy
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								3. Closed-Loop Commute Wallet & Non-Withdrawable Policy
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Compliance with Reserve Bank of India (RBI) Closed-Loop Prepaid Payment Instrument (PPI) directives.
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
								<div className="flex items-center gap-2 font-bold text-xs text-rose-800">
									<Lock className="w-4 h-4 text-rose-600 shrink-0" />
									<span>Non-Withdrawable Commute Wallet Policy</span>
								</div>
								<p className="text-[11px] leading-relaxed text-rose-800">
									Any money added to the Norimono Commute Wallet <strong>CANNOT</strong> be withdrawn, transferred back to personal bank accounts, or redeemed for cash. Wallet credits are strictly closed-loop and can solely be utilized to fund colleague carpool rides or fuel cost-sharing within the network.
								</p>
							</div>

							<div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-2">
								<span className="font-bold text-slate-900 text-xs block">
									Double-Entry Escrow & Trip Settlement:
								</span>
								<ul className="space-y-1.5 text-[11px] text-slate-600 list-disc list-inside">
									<li>
										<strong>Automated Escrow Hold:</strong> When a passenger books a seat, the exact algorithmic fare is placed in transactional escrow (`status: 'requested'`).
									</li>
									<li>
										<strong>OTP Handshake Release:</strong> Only upon successful boarding OTP verification and final trip completion does the backend transfer fuel credits to the driver's wallet.
									</li>
									<li>
										<strong>Instant Cancellation Refund:</strong> If a ride is cancelled before pickup, escrowed funds immediately revert to the employee's commute wallet.
									</li>
								</ul>
							</div>
						</div>
					</div>
				)}

				{activeSection === "identity" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Access Control
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								4. Corporate Work Email Verification & Identity Charter
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Zero public access. Closed-loop enterprise network integrity.
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<p>
								Norimono is an enterprise-exclusive mobility network. Every participant must authenticate through their verified employer domain (`@tcs.com`, `@infosys.com`, `@wipro.com`, `@google.com`, etc.).
							</p>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<CheckCircle2 className="w-4 h-4 text-emerald-600" />
										Verified Corporate Badges
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										Every profile is framed with their official corporate logo ring. Colleague identity, department, and work credentials are visible before ride acceptance.
									</p>
								</div>
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
										<Lock className="w-4 h-4 text-indigo-600" />
										No Anonymous Commuters
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										Guest accounts, public email addresses (Gmail, Yahoo, Outlook), and unverified external individuals are systematically blocked at the verification wall.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{activeSection === "safety" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Trust & Safety
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								5. Cabin Safety, OTP Handshake & Dual Rating System
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Comprehensive safety protocols and two-way peer accountability.
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
										<ShieldCheck className="w-4 h-4 text-teal-600" />
										Dual Rating System
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										Both coworkers evaluate each other: <strong>Passenger Etiquette Rating</strong> (punctuality, courtesy) and <strong>Driver Safety Score</strong> (smooth driving, road vigilance, cabin hygiene). Scores below 4.0 trigger automated review.
									</p>
								</div>
								<div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
									<span className="text-xs font-bold text-purple-800 flex items-center gap-1.5">
										<Lock className="w-4 h-4 text-purple-600" />
										4-Digit Boarding OTP
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										Drivers cannot initiate the trip without entering the passenger's unique 4-digit boarding OTP, completely preventing ghost pickups or accidental billing.
									</p>
								</div>
							</div>

							<div className="p-3 bg-pink-50 border border-pink-200 rounded-xl space-y-1 text-pink-900">
								<span className="font-bold text-xs text-pink-800 flex items-center gap-1.5">
									🌸 Dedicated Female-Only Commute Option
								</span>
								<p className="text-[11px] leading-relaxed text-pink-800">
									Female employees can toggle the <code>[ 🌸 Female-Only ]</code> filter to restrict match results and seat reservations exclusively to female colleagues and female drivers.
								</p>
							</div>
						</div>
					</div>
				)}

				{activeSection === "etiquette" && (
					<div className="space-y-4 animate-in fade-in duration-150">
						<div className="border-b border-slate-200 pb-3">
							<span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
								Commute Culture
							</span>
							<h2 className="text-lg font-black text-slate-900 mt-1">
								6. Cabin Amenities & BlaBlaCar Commute Code
							</h2>
							<p className="text-xs text-slate-600 mt-0.5">
								Setting clear expectations for a comfortable, stress-free office commute.
							</p>
						</div>

						<div className="space-y-3 text-xs text-slate-700 leading-relaxed">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
								<div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
									<span className="font-bold text-slate-800 block">The BlaBla Chattiness Meter</span>
									<span className="text-[10px] text-slate-500 block mt-0.5">
										Respect coworker preferences: <code>Bla</code> (silent/focus commute), <code>BlaBla</code> (friendly), or <code>BlaBlaBla</code> (social networking).
									</span>
								</div>
								<div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
									<span className="font-bold text-slate-800 block">Max 2 in the Back</span>
									<span className="text-[10px] text-slate-500 block mt-0.5">
										Comfort guarantee keeping the middle rear seat empty for personal space and laptop bag placement.
									</span>
								</div>
								<div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
									<span className="font-bold text-slate-800 block">Strictly No Smoking</span>
									<span className="text-[10px] text-slate-500 block mt-0.5">
										All Norimono vehicles are 100% tobacco and vape-free corporate transit environments.
									</span>
								</div>
							</div>

							<div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
								<span className="font-bold text-slate-800 block mb-0.5">Passenger Pickup Punctuality:</span>
								Colleagues are expected to be at their declared pickup point or corridor stopover 3 minutes before departure. Drivers may wait a maximum of 5 minutes before safely departing to ensure office arrival punctuality.
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);

	if (standalone) {
		return (
			<div className="min-h-screen bg-slate-950 p-4 md:p-8 flex items-center justify-center">
				<div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-800">
					<div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-xl bg-teal-500 flex items-center justify-center text-slate-950 font-black">
								<Scale className="w-4 h-4" />
							</div>
							<span className="font-bold text-sm">Norimono Terms of Service & Commute Charter</span>
						</div>
						<a
							href="/dashboard"
							className="text-xs text-teal-400 hover:text-teal-300 font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
						>
							Back to Dashboard →
						</a>
					</div>
					{content}
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[120] p-3 md:p-6 animate-in fade-in duration-200">
			<div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
				{/* Modal Top Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white shrink-0">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 bg-teal-500/20 text-teal-400 rounded-xl flex items-center justify-center font-bold">
							<Scale className="w-4 h-4" />
						</div>
						<div>
							<h2 className="text-sm font-black text-white tracking-tight">
								Terms of Service & White-Plate Charter
							</h2>
							<p className="text-[10px] text-teal-400 font-mono">
								Norimono Enterprise Mobility • Motor Vehicles Act Non-Commercial Mandate
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Modal Content */}
				{content}

				{/* Modal Footer */}
				<div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs shrink-0">
					<span className="text-[11px] text-slate-500">
						By using Norimono, you agree to these non-commercial white-plate terms.
					</span>
					<button
						onClick={onClose}
						className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
					>
						I Understand & Agree
					</button>
				</div>
			</div>
		</div>
	);
}

export default TermsModal;
