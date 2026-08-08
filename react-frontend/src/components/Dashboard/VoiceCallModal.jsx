import React, { useState, useEffect, useRef } from "react";
import { PhoneOff, Mic, MicOff, Volume2, ShieldCheck, User } from "lucide-react";
import { VoiceCall } from "../../utils/VoiceCall";

export default function VoiceCallModal({ isOpen, onClose, socket, activeTrip, user, isCaller = true }) {
	const [callState, setCallState] = useState("connecting"); // connecting, connected, closed, failed
	const [isMuted, setIsMuted] = useState(false);
	const [timerSeconds, setTimerSeconds] = useState(0);
	const voiceCallRef = useRef(null);

	const targetName = isCaller 
		? (activeTrip?.ride?.driver_name || "Rahul M. (Driver)")
		: (activeTrip?.passenger_name || "Employee Passenger");

	// Initialize WebRTC Voice Call when Modal opens
	useEffect(() => {
		if (!isOpen) return;

		const rideId = activeTrip?.ride?.ride_id || activeTrip?.ride_id || activeTrip?.booking_id || "DEMO_RIDE_1";
		
		const vc = new VoiceCall(socket, rideId, isCaller, (state) => {
			setCallState(state);
			if (state === "closed" || state === "failed") {
				setTimeout(() => {
					onClose();
				}, 1200);
			}
		});

		voiceCallRef.current = vc;
		vc.start();

		return () => {
			if (voiceCallRef.current) {
				voiceCallRef.current.endCall();
			}
		};
	}, [isOpen, socket, activeTrip, isCaller]);

	// Call Duration Timer
	useEffect(() => {
		let interval = null;
		if (callState === "connected") {
			interval = setInterval(() => {
				setTimerSeconds((prev) => prev + 1);
			}, 1000);
		} else {
			setTimerSeconds(0);
		}
		return () => clearInterval(interval);
	}, [callState]);

	const formatTimer = (sec) => {
		const mins = Math.floor(sec / 60);
		const remainderSecs = sec % 60;
		return `${mins.toString().padStart(2, "0")}:${remainderSecs.toString().padStart(2, "0")}`;
	};

	const handleToggleMute = () => {
		if (voiceCallRef.current) {
			const muted = voiceCallRef.current.toggleMute();
			setIsMuted(muted);
		}
	};

	const handleEndCall = () => {
		if (voiceCallRef.current) {
			voiceCallRef.current.endCall();
		}
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 text-left">
			<div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#714B67]/40 text-white rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative transform transition-all">
				
				{/* Encrypted Badge */}
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold mb-6">
					<ShieldCheck className="w-3.5 h-3.5" />
					<span>End-to-End Encrypted Peer Call</span>
				</div>

				{/* Avatar & Pulse Rings */}
				<div className="relative mb-6 flex items-center justify-center">
					{callState === "connecting" && (
						<div className="absolute inset-0 w-28 h-28 rounded-full bg-[#00A09D]/20 animate-ping"></div>
					)}
					<div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00A09D] to-[#714B67] flex items-center justify-center shadow-lg border-2 border-white/20 z-10 text-white font-extrabold text-3xl">
						<User className="w-12 h-12 text-white" />
					</div>
				</div>

				{/* Name & Status */}
				<h3 className="text-xl font-extrabold text-white text-center mb-1">
					{targetName}
				</h3>
				<p className="text-xs text-white/60 font-medium mb-3">
					MakeLyft Corporate Commute Call
				</p>

				{/* Timer or Status */}
				<div className="text-sm font-extrabold tracking-widest text-[#00A09D] mb-8">
					{callState === "connected" ? (
						<span className="font-mono text-emerald-400 text-base">{formatTimer(timerSeconds)}</span>
					) : callState === "closed" ? (
						<span className="text-rose-400">Call Ended</span>
					) : callState === "failed" ? (
						<span className="text-rose-400">Call Failed</span>
					) : (
						<span className="animate-pulse">Calling...</span>
					)}
				</div>

				{/* Call Controls */}
				<div className="flex items-center gap-6 mt-2">
					{/* Mute Button */}
					<button
						onClick={handleToggleMute}
						className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
							isMuted 
								? "bg-rose-500 text-white hover:bg-rose-600" 
								: "bg-white/10 hover:bg-white/20 text-white border border-white/20"
						}`}
						title={isMuted ? "Unmute" : "Mute"}
					>
						{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
					</button>

					{/* End Call Button */}
					<button
						onClick={handleEndCall}
						className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all transform hover:scale-105 cursor-pointer"
						title="End Call"
					>
						<PhoneOff className="w-7 h-7" />
					</button>

					{/* Speaker Button */}
					<button
						className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md"
						title="Speakerphone"
					>
						<Volume2 className="w-6 h-6" />
					</button>
				</div>
			</div>
		</div>
	);
}
