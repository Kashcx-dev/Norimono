import React, { useState, useEffect } from "react";
import { showAlert } from "../../utils/alertService";
import { io } from "socket.io-client";
import { Phone, PhoneOff, PhoneCall, X } from "lucide-react";
import Header from "./Header";
import MapPlaceholder from "./MapPlaceholder";
import RideActions from "./RideActions";
import BrowseRidesPanel from "./BrowseRidesPanel";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import AIAssistant from "./AIAssistant";
import ActiveTripPanel from "./ActiveTripPanel";
import ChatModal from "./ChatModal";
import VoiceCallModal from "./VoiceCallModal";
import HistoryModal from "./HistoryModal";
import FeedbackModal from "./FeedbackModal";
import ProfileModal from "./ProfileModal";
import PublishRideModal from "./PublishRideModal";
import ImpactScreen from "./ImpactScreen";

// Initialize socket connection (connects to the same origin by default)
const socket = io();

function Dashboard() {
	const [viewMode, setViewMode] = useState("default"); // 'default' | 'browse'
	const [showVehicleModal, setShowVehicleModal] = useState(false);
	const [showPublishModal, setShowPublishModal] = useState(false);
	const [showImpactModal, setShowImpactModal] = useState(false);
	const [hasVehicle, setHasVehicle] = useState("0");
	const [riderType, setRiderType] = useState("passenger");

	const [userLocation, setUserLocation] = useState(null);
	const [pickupCoords, setPickupCoords] = useState(null);
	const [dropoffCoords, setDropoffCoords] = useState(null);
	const [routePolyline, setRoutePolyline] = useState(null);

	// Browse mode states
	const [nearbyRides, setNearbyRides] = useState([]);
	const [loadingNearby, setLoadingNearby] = useState(false);
	const [selectedRide, setSelectedRide] = useState(null);
	const [activeTrip, setActiveTrip] = useState(null);
	const [showGlobalChat, setShowGlobalChat] = useState(false);
	const [showGlobalVoiceCall, setShowGlobalVoiceCall] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [showFeedbackModal, setShowFeedbackModal] = useState(false);
	const [showProfileModal, setShowProfileModal] = useState(false);
	const [isIncomingCall, setIsIncomingCall] = useState(false);
	const [incomingCall, setIncomingCall] = useState(null);

	const user = JSON.parse(localStorage.getItem("user") || "{}");

	// Get user's current location on mount
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const coords = [pos.coords.latitude, pos.coords.longitude];
					setUserLocation(coords);
					setPickupCoords(coords); // Default pickup to current location
				},
				(err) => {
					console.warn(
						"Geolocation permission denied or unavailable:",
						err.message,
					);
					// Default fallback coordinates: Kolkata
					const defaultCoords = [22.5726, 88.3639];
					setUserLocation(defaultCoords);
					setPickupCoords(defaultCoords);
				},
				{ enableHighAccuracy: true, timeout: 10000 },
			);
		} else {
			const defaultCoords = [22.5726, 88.3639];
			setUserLocation(defaultCoords);
			setPickupCoords(defaultCoords);
		}
	}, []);

	// Fetch Driver's Active Ride
	const fetchDriverActiveRide = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const res = await fetch("/rides/driver/active", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.ride) {
				setActiveTrip({
					mode: "driver",
					ride: data.ride,
					bookings: data.ride.bookings || [],
				});
			}
		} catch (err) {
			console.error("Error fetching active driver ride:", err);
		}
	};

	// Fetch Passenger's Active Ride
	const fetchPassengerActiveRide = async () => {
		const token = localStorage.getItem("token");
		if (!token) return;
		try {
			const res = await fetch("/rides/passenger/active", {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (data.success && data.ride && data.booking) {
				setActiveTrip({
					mode: "passenger",
					ride: data.ride,
					booking_id: data.booking.booking_id,
					booking_status: data.booking.booking_status,
					otp: data.booking.otp,
					payment_status: data.booking.payment_status,
				});
			}
		} catch (err) {
			console.error("Error fetching active passenger ride:", err);
		}
	};

	// Check if user already has a vehicle registered & Check active ride
	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		setHasVehicle(user.is_vehicle_registered || "0");
		setRiderType(user.rider_type || "passenger");
		fetchDriverActiveRide();
		fetchPassengerActiveRide();
		
		if (user && user.emp_id) {
			socket.emit("register_user", { emp_id: user.emp_id });
		}

		// Listen for incoming call invites
		const handleIncomingCall = (data) => {
			setIncomingCall(data);
		};

		// Listen for incoming voice call WebRTC signals
		const handleVoiceSignal = (data) => {
			if (data.type === "offer" && !showGlobalVoiceCall) {
				setIsIncomingCall(true);
				setShowGlobalVoiceCall(true);
			}
		};

		// Listen for admin rider verification updates
		const handleVerificationUpdate = (data) => {
			if (data.status === "approved") {
				setHasVehicle("2");
				const stored = JSON.parse(localStorage.getItem("user") || "{}");
				stored.is_vehicle_registered = "2";
				localStorage.setItem("user", JSON.stringify(stored));
				showAlert(
					data.message || "Your driver credentials have been verified and approved by the Administrator!",
					"Driver Verification Approved",
					"success"
				);
			} else if (data.status === "rejected") {
				setHasVehicle("0");
				const stored = JSON.parse(localStorage.getItem("user") || "{}");
				stored.is_vehicle_registered = "0";
				localStorage.setItem("user", JSON.stringify(stored));
				showAlert(
					data.message || "Your driver verification was rejected by Administrator.",
					"Verification Update",
					"warning"
				);
			}
		};

		socket.on("incoming_call", handleIncomingCall);
		socket.on("voice_signal", handleVoiceSignal);
		socket.on("rider_verification_status", handleVerificationUpdate);

		return () => {
			socket.off("incoming_call", handleIncomingCall);
			socket.off("voice_signal", handleVoiceSignal);
			socket.off("rider_verification_status", handleVerificationUpdate);
		};
	}, []);

	const handleAcceptIncomingCall = () => {
		if (incomingCall) {
			if (incomingCall.ride_id) {
				socket.emit("join_ride_room", { ride_id: incomingCall.ride_id });
			}
			socket.emit("call_response", {
				caller_emp_id: incomingCall.caller_emp_id,
				ride_id: incomingCall.ride_id,
				accepted: true,
			});
			setIsIncomingCall(true);
			setShowGlobalVoiceCall(true);
			setIncomingCall(null);
		}
	};

	const handleDeclineIncomingCall = () => {
		if (incomingCall) {
			socket.emit("call_response", {
				caller_emp_id: incomingCall.caller_emp_id,
				ride_id: incomingCall.ride_id,
				accepted: false,
			});
			setIncomingCall(null);
		}
	};

	const handleToggleRole = async (targetMode) => {
		if (targetMode === "rider" && hasVehicle !== "2") {
			if (hasVehicle === "1") {
				showAlert("Your driver credentials are pending Administrator verification.", "Pending Approval", "info");
			} else {
				setShowVehicleModal(true);
			}
			return;
		}

		setRiderType(targetMode);
		const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
		storedUser.rider_type = targetMode;
		localStorage.setItem("user", JSON.stringify(storedUser));

		const token = localStorage.getItem("token");
		if (token) {
			try {
				await fetch("/auth/toggle-rider-mode", {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
					body: JSON.stringify({ target_mode: targetMode }),
				});
			} catch (e) {
				console.warn("Toggle role sync:", e);
			}
		}

		if (targetMode === "rider") {
			setShowPublishModal(true);
		} else {
			showAlert("Switched to Passenger Mode. You can now search and book seats with colleagues.", "Passenger Mode Active", "success");
		}
	};

	const handlePublishRide = () => {
		if (hasVehicle === "0" || !hasVehicle) {
			setShowVehicleModal(true);
		} else if (hasVehicle === "1") {
			showAlert("Your vehicle registration is pending Admin approval.", "Pending Approval", "info");
		} else if (hasVehicle === "2") {
			setShowPublishModal(true);
		}
	};

	const handleRidePublished = (publishData) => {
		setShowPublishModal(false);
		showAlert(
			"Your ride has been successfully published! Passengers will now be able to search and book seats on your route.",
			"Ride Published",
			"success"
		);
		fetchDriverActiveRide();
	};

	const handleRegisterVehicle = async (vehicleData) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/register-vehicle", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(vehicleData),
			});
			const data = await res.json();
			if (data.success) {
				setHasVehicle("1");
				setShowVehicleModal(false);
				const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
				storedUser.is_vehicle_registered = "1";
				localStorage.setItem("user", JSON.stringify(storedUser));
				showAlert(
					"Vehicle registered successfully! It is now pending Admin approval.",
					"Registration Submitted",
					"success"
				);
			} else {
				showAlert(
					"Vehicle registration failed: " +
						(data.message || "Please check details"),
					"Registration Error",
					"error"
				);
			}
		} catch (err) {
			console.error("Error registering vehicle:", err);
			showAlert("Error registering vehicle. Please try again.", "Network Error", "error");
		}
	};

	const handleLocationUpdate = (type, coords) => {
		if (type === "source") setPickupCoords(coords);
		if (type === "destination") setDropoffCoords(coords);
		setRoutePolyline(null); // Reset route when location changes
	};

	const handleBrowseRides = async () => {
		setViewMode("browse");
		setLoadingNearby(true);
		try {
			const token = localStorage.getItem("token");
			let queryUrl = "/rides";
			const params = new URLSearchParams();
			if (pickupCoords && pickupCoords.length === 2) {
				params.append("pickup_lat", pickupCoords[0]);
				params.append("pickup_lng", pickupCoords[1]);
			}
			if (dropoffCoords && dropoffCoords.length === 2) {
				params.append("dropoff_lat", dropoffCoords[0]);
				params.append("dropoff_lng", dropoffCoords[1]);
			}
			if (params.toString()) {
				queryUrl += `?${params.toString()}`;
			}
			const res = await fetch(queryUrl, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});
			const data = await res.json();
			if (data.success && data.rides) {
				setNearbyRides(data.rides);
				// Do not auto-select the first ride so the map stays focused on the user's searched route
			}
		} catch (err) {
			console.error("Failed to fetch nearby rides:", err);
		} finally {
			setLoadingNearby(false);
		}
	};

	const handleBackToSearch = () => {
		setViewMode("default");
		setSelectedRide(null);
	};

	const handleRideBooked = (bookingSuccessData) => {
		// When a ride is booked successfully, switch to active trip view
		setActiveTrip({
			mode: "passenger",
			...bookingSuccessData,
		});
	};

	const handleTripEnded = () => {
		setActiveTrip(null);
	};

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-left select-none font-sans">
			{/* Fullscreen Map Canvas */}
			<div className="absolute inset-0 w-full h-full z-0">
				<MapPlaceholder
					pickupCoords={pickupCoords}
					dropoffCoords={dropoffCoords}
					routePolyline={routePolyline}
					userLocation={userLocation}
					viewMode={viewMode}
					nearbyRides={nearbyRides}
					selectedRide={selectedRide}
					onSelectRide={setSelectedRide}
					activeTrip={activeTrip}
				/>
			</div>

			{/* Uber-Style Floating Top Bar */}
			<Header 
				socket={socket}
				hasVehicle={hasVehicle}
				onPublishRide={handlePublishRide}
				onOpenImpact={() => setShowImpactModal(true)}
				onOpenVehicleModal={() => setShowVehicleModal(true)}
				onOpenChat={() => setShowGlobalChat(true)}
				onOpenVoiceCall={() => {
					setIsIncomingCall(false);
					setShowGlobalVoiceCall(true);
				}}
				onOpenHistory={() => setShowHistoryModal(true)}
				onOpenFeedback={() => setShowFeedbackModal(true)}
				onOpenProfile={() => setShowProfileModal(true)}
			/>

			{/* Uber-Style Bottom Sheet / Floating Drawer */}
			<div className="fixed z-30 bottom-0 left-0 right-0 md:left-6 md:bottom-6 md:w-[440px] max-h-[85vh] flex flex-col pointer-events-none">
				<div className="bg-white/95 backdrop-blur-2xl rounded-t-3xl md:rounded-3xl border border-slate-200/90 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] md:shadow-2xl overflow-hidden flex flex-col max-h-[85vh] pointer-events-auto transition-all duration-300">
					{/* Mobile drag handle */}
					<div className="w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />

					{activeTrip ? (
						<div className="overflow-y-auto p-4 max-h-[75vh]">
							<ActiveTripPanel
								activeTrip={activeTrip}
								socket={socket}
								onTripEnded={handleTripEnded}
								onRefreshPassenger={fetchPassengerActiveRide}
							/>
						</div>
					) : viewMode === "browse" ? (
						<div className="overflow-y-auto max-h-[75vh]">
							<BrowseRidesPanel
								rides={nearbyRides}
								loading={loadingNearby}
								selectedRide={selectedRide}
								onSelectRide={setSelectedRide}
								onBack={handleBackToSearch}
								userLocation={userLocation}
								activeTrip={activeTrip}
								onRideBooked={(bookingData) => {
									setViewMode("default");
									handleRideBooked(bookingData);
								}}
							/>
						</div>
					) : (
						<div className="overflow-y-auto p-4 md:p-5 max-h-[75vh]">
							<RideActions
								onLocationUpdate={handleLocationUpdate}
								pickupCoords={pickupCoords}
								dropoffCoords={dropoffCoords}
								userLocation={userLocation}
								onSearchRoute={setRoutePolyline}
								onBrowseRides={handleBrowseRides}
							/>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			{incomingCall && (
				<div className="fixed top-6 right-6 z-[200] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 max-w-sm w-full flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-pulse shrink-0">
							<PhoneCall className="w-5 h-5" />
						</div>
						<div className="min-w-0">
							<p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Incoming Call</p>
							<p className="text-sm font-bold text-gray-900 truncate">{incomingCall.caller_name || "Colleague"}</p>
							<p className="text-xs text-gray-500">Commute Voice Call</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<button
							onClick={handleAcceptIncomingCall}
							className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
							title="Accept Call"
						>
							<Phone className="w-4 h-4" />
						</button>
						<button
							onClick={handleDeclineIncomingCall}
							className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
							title="Decline Call"
						>
							<PhoneOff className="w-4 h-4" />
						</button>
					</div>
				</div>
			)}

			{showVehicleModal && (
				<VehicleRegistrationModal
					onClose={() => setShowVehicleModal(false)}
					onRegister={handleRegisterVehicle}
				/>
			)}

			{showGlobalChat && (
				<ChatModal
					isOpen={showGlobalChat}
					onClose={() => setShowGlobalChat(false)}
					socket={socket}
					activeTrip={
						activeTrip || {
							ride: { ride_id: "DEMO_RIDE_1", driver_name: "Rahul M." },
						}
					}
					user={user}
				/>
			)}

			{showPublishModal && (
				<PublishRideModal
					onClose={() => setShowPublishModal(false)}
					onPublish={handleRidePublished}
					userLocation={userLocation}
				/>
			)}
			{showGlobalVoiceCall && (
				<VoiceCallModal
					isOpen={showGlobalVoiceCall}
					onClose={() => {
						setShowGlobalVoiceCall(false);
						setIsIncomingCall(false);
					}}
					socket={socket}
					activeTrip={activeTrip || { ride: { ride_id: "DEMO_RIDE_1", driver_name: "Rahul M." } }}
					user={user}
					isCaller={!isIncomingCall}
				/>
			)}
			
			<HistoryModal 
				isOpen={showHistoryModal} 
				onClose={() => setShowHistoryModal(false)} 
			/>

			<FeedbackModal
				isOpen={showFeedbackModal}
				onClose={() => setShowFeedbackModal(false)}
			/>
			
			<ProfileModal
				isOpen={showProfileModal}
				onClose={() => setShowProfileModal(false)}
			/>

			{/* Fullscreen ESG & Campus Impact Screen Modal (Pitch Deck Showcase) */}
			{showImpactModal && (
				<div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 overflow-y-auto">
					<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-6xl w-full max-h-[92vh] overflow-y-auto relative shadow-2xl">
						<button
							onClick={() => setShowImpactModal(false)}
							className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
						>
							<X className="w-4 h-4" />
						</button>
						<ImpactScreen onClose={() => setShowImpactModal(false)} />
					</div>
				</div>
			)}
		</div>
	);
}

export default Dashboard;
