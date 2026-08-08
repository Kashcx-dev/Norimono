import React, { useState, useEffect } from "react";
import { Car, MapPin, CheckCircle2, Navigation, Loader2, MessageSquare, ArrowLeft, Clock, Calendar } from "lucide-react";
import ChatModal from "./ChatModal";

export default function ActiveTripPanel({
	activeTrip,
	socket,
	onTripEnded,
}) {
	const isDriver = activeTrip.mode === "driver";
	
	const [otpInput, setOtpInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("pending"); // pending, picked_up, dropped_off
	const [liveLocation, setLiveLocation] = useState(null);
	const [phase, setPhase] = useState("Waiting for pickup");
	const [isChatOpen, setIsChatOpen] = useState(false);
	
	const user = JSON.parse(localStorage.getItem("user") || "{}");

	useEffect(() => {
		if (!socket || !activeTrip.ride?.ride_id) return;

		// Join the ride room for live updates
		socket.emit("join_ride_room", { ride_id: activeTrip.ride.ride_id });

		// Listen for location updates (mostly useful for passenger)
		const handleLocationUpdate = (data) => {
			if (data.status === 'Arrived') {
				setPhase(`Arrived at ${data.phase === 'driving' ? 'Destination' : 'Pickup'}`);
			} else {
				setPhase(`Moving to ${data.phase === 'driving' ? 'Destination' : 'Pickup'}`);
			}
			setLiveLocation(data.currentLocation);
		};

		socket.on("location_update", handleLocationUpdate);

		return () => {
			socket.off("location_update", handleLocationUpdate);
		};
	}, [socket, activeTrip]);

	const handleVerifyOTP = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/pickup-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					booking_id: activeTrip.booking_id,
					otp: otpInput
				})
			});
			const data = await res.json();
			if (data.success) {
				setStatus("picked_up");
				alert("Passenger Verified! Starting navigation.");
				
				// Start live tracking for passenger
				if (socket && activeTrip.ride) {
					// Use origin/dest coordinates if available, else mock coordinates
					const start = activeTrip.ride.origin?.coords || [22.5726, 88.3639];
					const end = activeTrip.ride.destination?.coords || [22.6, 88.4];
					
					socket.emit("start_tracking", {
						ride_id: activeTrip.ride.ride_id,
						startCoords: start,
						endCoords: end,
						phase: "driving"
					});
				}
			} else {
				alert(data.message || "Invalid OTP");
			}
		} catch (err) {
			console.error(err);
			alert("Error verifying OTP");
		} finally {
			setLoading(false);
		}
	};

	const handleDropOff = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/drop-passenger", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ booking_id: activeTrip.booking_id })
			});
			const data = await res.json();
			if (data.success) {
				setStatus("dropped_off");
				alert("Passenger dropped off successfully.");
			} else {
				alert(data.message || "Error dropping off");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleFinishTrip = async () => {
		setLoading(true);
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/finish-ride", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ ride_id: activeTrip.ride.ride_id })
			});
			const data = await res.json();
			if (data.success) {
				alert(`Trip finished! Earnings processed: ₹${data.earnings}`);
				onTripEnded();
			} else {
				alert(data.message || "Error finishing trip");
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left">
			<div className="p-5 border-b border-gray-100 bg-[#00A09D]/5 flex items-center justify-between">
				<div>
					<h2 className="text-lg font-extrabold text-[#00A09D]">
						{isDriver ? "Active Drive" : "Active Ride"}
					</h2>
					<p className="text-xs text-gray-500">
						{phase} {liveLocation ? `(Live: ${liveLocation[0].toFixed(3)}, ${liveLocation[1].toFixed(3)})` : ""}
					</p>
				</div>
				<button
					onClick={onTripEnded}
					className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
				>
					<ArrowLeft className="w-4 h-4 text-[#714B67]" /> Back to Dashboard
				</button>
			</div>

			<div className="flex-1 p-6 flex flex-col space-y-6">
				{/* Ride Details Card */}
				<div className="p-4 rounded-xl border border-gray-200 bg-gray-50 relative">
					<button 
						onClick={() => setIsChatOpen(true)}
						className="absolute top-4 right-4 bg-white border border-gray-200 hover:border-[#714B67] hover:text-[#714B67] text-gray-600 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-xs font-bold transition-all cursor-pointer"
					>
						<MessageSquare className="w-4 h-4" /> Message
					</button>

					<div className="flex items-center gap-3 mb-4 pr-24">
						<div className="w-10 h-10 rounded-full bg-[#714B67]/10 flex items-center justify-center text-[#714B67]">
							<Car className="w-5 h-5" />
						</div>
						<div>
							<p className="text-sm font-bold text-gray-900">
								{isDriver ? "Passenger: " + (activeTrip.passenger_name || "Assigned") : "Driver: " + (activeTrip.ride?.driver_name || "Unknown")}
							</p>
							<p className="text-xs text-gray-500">
								{activeTrip.ride?.vehicle_model || "Car"} • {activeTrip.ride?.veh_no || "Registration"}
							</p>
						</div>
					</div>

					<div className="space-y-2 text-xs text-gray-700">
						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-[#00A09D]" />
							<span className="font-semibold truncate">
								Pickup: {typeof activeTrip.ride?.origin === 'string' 
									? activeTrip.ride.origin 
									: (activeTrip.ride?.origin?.name || activeTrip.ride?.origin?.address || "Pickup Point")}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="w-4 h-4 text-[#EF4444]" />
							<span className="font-semibold truncate">
								Dropoff: {typeof activeTrip.ride?.destination === 'string' 
									? activeTrip.ride.destination 
									: (activeTrip.ride?.destination?.name || activeTrip.ride?.destination?.address || "Destination Point")}
							</span>
						</div>
					</div>
				</div>

				{/* Rich Time Slot & Departure Info */}
				<div className="p-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/30 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
							<Clock className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
								Departure Time Slot
							</p>
							<p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mt-0.5">
								<Calendar className="w-3.5 h-3.5 text-indigo-500" />
								{activeTrip.ride?.departure_time || activeTrip.ride?.time || "Today, 9:30 AM"}
							</p>
						</div>
					</div>
					<div className="text-right">
						<span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
							Commences in ~2 hrs
						</span>
					</div>
				</div>

				{/* Passenger Specific View */}
				{!isDriver && (
					<div className="bg-teal-50 border border-teal-100 rounded-xl p-6 text-center space-y-2">
						<p className="text-xs font-bold text-teal-800 uppercase tracking-widest">Share this OTP with Driver</p>
						<div className="text-4xl font-mono font-black text-[#00A09D] tracking-widest">
							{activeTrip.otp}
						</div>
						<p className="text-xs text-teal-600 mt-2">
							Keep this screen open to track your ride. Wait for the driver to arrive and verify this OTP.
						</p>
					</div>
				)}

				{/* Driver Specific View */}
				{isDriver && (
					<div className="space-y-4">
						{status === "pending" && (
							<div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
								<label className="text-xs font-bold text-gray-700 uppercase">Passenger OTP Verification</label>
								<div className="flex gap-2">
									<input 
										type="text" 
										placeholder="Enter 4-digit OTP" 
										value={otpInput}
										onChange={(e) => setOtpInput(e.target.value)}
										maxLength={4}
										className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00A09D]/20 focus:border-[#00A09D]"
									/>
									<button
										onClick={handleVerifyOTP}
										disabled={loading || otpInput.length < 4}
										className="bg-[#00A09D] hover:bg-[#008f8c] disabled:bg-[#00A09D]/50 text-white px-6 rounded-xl font-bold text-sm shadow-sm transition-all"
									>
										{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
									</button>
								</div>
							</div>
						)}

						{status === "picked_up" && (
							<div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-3">
								<div className="flex items-center gap-2 text-amber-800 font-bold">
									<Navigation className="w-5 h-5" /> Trip in Progress
								</div>
								<button
									onClick={handleDropOff}
									disabled={loading}
									className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2"
								>
									{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Drop Off Passenger"}
								</button>
							</div>
						)}

						{status === "dropped_off" && (
							<div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-3">
								<div className="flex items-center gap-2 text-emerald-800 font-bold">
									<CheckCircle2 className="w-5 h-5" /> Passenger Dropped Off
								</div>
								<button
									onClick={handleFinishTrip}
									disabled={loading}
									className="w-full bg-[#714B67] hover:bg-[#5c3c54] text-white py-3 rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2"
								>
									{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish Entire Trip & Collect Fare"}
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			<ChatModal 
				isOpen={isChatOpen} 
				onClose={() => setIsChatOpen(false)} 
				socket={socket} 
				activeTrip={activeTrip} 
				user={user} 
			/>
		</div>
	);
}
