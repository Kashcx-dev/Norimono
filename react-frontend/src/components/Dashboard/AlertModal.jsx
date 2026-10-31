import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Info, X, ShieldCheck, Sparkles } from "lucide-react";
import { subscribeAlert } from "../../utils/alertService";

export default function AlertModal() {
	const [alertConfig, setAlertConfig] = useState(null);
	const [isFading, setIsFading] = useState(false);
	const timerRef = useRef(null);

	useEffect(() => {
		const unsubscribe = subscribeAlert(({ message, title, type }) => {
			if (timerRef.current) clearTimeout(timerRef.current);
			setIsFading(false);
			setAlertConfig({ message, title, type });

			// Auto fade out after 4 seconds
			timerRef.current = setTimeout(() => {
				setIsFading(true);
				setTimeout(() => setAlertConfig(null), 300); // Wait for fade-out transition
			}, 4000);
		});

		return () => {
			unsubscribe();
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	if (!alertConfig) return null;

	const { message, title, type } = alertConfig;
	const isVerified = (title && title.toLowerCase().includes("verified")) || 
	                   (message && message.toLowerCase().includes("verified"));

	const getIcon = () => {
		if (isVerified) {
			return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
		}
		switch (type) {
			case "success":
				return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
			case "error":
				return <AlertCircle className="w-5 h-5 text-rose-400" />;
			default:
				return <Info className="w-5 h-5 text-teal-400" />;
		}
	};

	const handleClose = () => {
		if (timerRef.current) clearTimeout(timerRef.current);
		setIsFading(true);
		setTimeout(() => setAlertConfig(null), 250);
	};

	return (
		<div className="fixed top-5 inset-x-4 md:inset-x-auto md:right-6 md:max-w-md z-[300] pointer-events-none select-none">
			<div
				className={`pointer-events-auto bg-slate-950/95 backdrop-blur-2xl border border-white/15 text-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-4 flex items-start gap-3.5 transition-all duration-300 transform ${
					isFading ? "opacity-0 -translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4"
				}`}
			>
				{/* Status Icon */}
				<div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
					isVerified || type === "success" 
						? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
						: type === "error"
						? "bg-rose-500/15 border-rose-500/30 text-rose-400"
						: "bg-teal-500/15 border-teal-500/30 text-teal-400"
				}`}>
					{getIcon()}
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0 pr-1 text-left">
					<div className="flex items-center gap-2 mb-0.5">
						<h4 className="text-xs font-black tracking-tight text-white truncate">
							{title || "Norimono Notice"}
						</h4>
						{isVerified && (
							<span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5">
								<Sparkles className="w-2.5 h-2.5" /> Verified
							</span>
						)}
					</div>
					<p className="text-[11px] text-slate-300 leading-relaxed font-medium">
						{message}
					</p>
				</div>

				{/* Quick Dismiss button */}
				<button
					onClick={handleClose}
					className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
					title="Dismiss"
				>
					<X className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}
