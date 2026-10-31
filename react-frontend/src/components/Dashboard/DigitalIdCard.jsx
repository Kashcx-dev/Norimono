import React from "react";
import { ShieldCheck, Building2, Award, Leaf, Star, CheckCircle2, Lock, Sparkles, X, User } from "lucide-react";
import { getCompanyInfo } from "../../utils/companyBadges";

export default function DigitalIdCard({
	user,
	compact = false,
	onClose,
	showModal = false
}) {
	if (!user) return null;

	const companyInfo = getCompanyInfo(user.org_name || user.email || user.driver_company);
	const Logo = companyInfo.Logo;
	const name = user.name || user.driver_name || "Verified Colleague";
	const email = user.email || user.driver_email || `colleague@${companyInfo.shortName.toLowerCase()}.com`;
	const empId = user.emp_id || user.driver_id || "EMP-7782";
	const designation = user.designation || user.driver_designation || "Senior Systems Specialist";
	const department = user.department || user.driver_department || "Technology Operations";
	const trustScore = user.trust_score || user.driver_trust_score || "99.8";
	const ridesCount = user.total_rides_completed || user.driver_rides_count || "24";
	const co2Saved = user.co2_saved_kg || user.driver_co2_saved || "68.2";
	const isVerified = user.is_vehicle_registered === "2" || user.is_verified || true;

	// Compact Badge View for list feeds or header
	if (compact) {
		return (
			<div className="flex items-center gap-3">
				{/* Avatar with Company Framed Ring */}
				<div className="relative group cursor-pointer">
					<div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 ${companyInfo.borderRing} p-0.5 shadow-sm flex items-center justify-center relative overflow-visible`}>
						<div className="w-full h-full rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight overflow-hidden">
							{name.charAt(0).toUpperCase()}
						</div>
					</div>
					{/* Verified Company Badge Tag */}
					<div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md shadow-md border border-white bg-white flex items-center justify-center p-0.5">
						<Logo />
					</div>
				</div>

				<div className="flex flex-col text-left leading-tight min-w-0">
					<div className="flex items-center gap-1.5">
						<span className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{name}</span>
						<ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Corporate Verified" />
					</div>
					<div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
						<span className="font-semibold text-slate-700">{companyInfo.shortName}</span>
						<span>•</span>
						<span className="truncate">{department}</span>
					</div>
				</div>
			</div>
		);
	}

	// Full Card (Standalone or Modal)
	const cardContent = (
		<div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl p-6 relative overflow-hidden text-slate-900 select-none">
			{/* Top Corporate Gradient Header Band */}
			<div 
				className="absolute top-0 left-0 right-0 h-28 opacity-90"
				style={{
					background: `linear-gradient(135deg, ${companyInfo.color} 0%, #0F172A 100%)`
				}}
			/>

			{/* Micro-pattern overlay */}
			<div className="absolute top-0 left-0 right-0 h-28 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

			{/* Close button if modal */}
			{onClose && (
				<button 
					onClick={onClose}
					className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer"
				>
					<X className="w-4 h-4" />
				</button>
			)}

			{/* Content Wrapper */}
			<div className="relative z-10 pt-8 flex flex-col items-center">
				{/* Avatar Framed by Official Corporate Logo */}
				<div className="relative mb-3">
					<div className={`w-24 h-24 rounded-3xl bg-white p-1 shadow-xl border-2 ${companyInfo.borderRing} flex items-center justify-center`}>
						<div className="w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-center text-3xl font-black shadow-inner">
							{name.charAt(0).toUpperCase()}
						</div>
					</div>

					{/* Framed Corporate Logo Badge */}
					<div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white border-2 border-white shadow-lg p-1 flex items-center justify-center">
						<Logo />
					</div>

					{/* Active Verified Pill */}
					<div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white">
						<ShieldCheck className="w-3 h-3" />
						<span>Vetted</span>
					</div>
				</div>

				{/* User Name & Work Details */}
				<h3 className="text-xl font-extrabold text-slate-900 tracking-tight text-center">{name}</h3>
				<p className="text-xs font-semibold text-slate-500 tracking-wide mt-0.5">{designation}</p>

				{/* Company & Department Tag */}
				<div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 border border-slate-200 rounded-full mt-2.5">
					<div className="w-3.5 h-3.5 shrink-0">
						<Logo />
					</div>
					<span className="text-xs font-bold text-slate-800">{companyInfo.name}</span>
					<span className="text-slate-300">•</span>
					<span className="text-xs text-slate-500 font-medium">{department}</span>
				</div>

				{/* Corporate Email & ID Stub */}
				<div className="w-full bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 mt-4 space-y-1.5 text-xs text-slate-600">
					<div className="flex justify-between items-center">
						<span className="text-slate-400 font-medium">Work Email:</span>
						<span className="font-mono font-semibold text-slate-800">{email}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-slate-400 font-medium">Employee ID:</span>
						<span className="font-mono font-semibold text-slate-800">{empId}</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-slate-400 font-medium">SSO Verification:</span>
						<span className="text-emerald-600 font-bold flex items-center gap-1">
							<CheckCircle2 className="w-3 h-3" /> 100% Certified
						</span>
					</div>
				</div>

				{/* Trust & ESG Impact Grid */}
				<div className="grid grid-cols-3 gap-2 w-full mt-3">
					<div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
						<div className="flex items-center gap-0.5 text-amber-500 mb-0.5">
							<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
							<span className="text-xs font-black text-slate-900">{trustScore}%</span>
						</div>
						<span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Safety Index</span>
					</div>

					<div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
						<div className="flex items-center gap-0.5 text-emerald-600 mb-0.5">
							<Leaf className="w-3.5 h-3.5 text-emerald-500" />
							<span className="text-xs font-black text-slate-900">{co2Saved}kg</span>
						</div>
						<span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CO2 Saved</span>
					</div>

					<div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
						<div className="flex items-center gap-0.5 text-sky-600 mb-0.5">
							<Award className="w-3.5 h-3.5 text-sky-500" />
							<span className="text-xs font-black text-slate-900">{ridesCount}</span>
						</div>
						<span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Commutes</span>
					</div>
				</div>

				{/* Legal Trust Assurance Footer */}
				<div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
					<Lock className="w-3 h-3 text-slate-400" />
					<span>Closed-network peer trust • Zero strangers</span>
				</div>
			</div>
		</div>
	);

	if (showModal) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
				{cardContent}
			</div>
		);
	}

	return cardContent;
}
