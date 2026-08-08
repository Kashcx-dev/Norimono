import React, { useState, useEffect } from "react";
import Header from "./Header";
import MapPlaceholder from "./MapPlaceholder";
import RideActions from "./RideActions";
import BrowseRidesPanel from "./BrowseRidesPanel";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import AIAssistant from "./AIAssistant";

function Dashboard() {
	const [viewMode, setViewMode] = useState("default"); // 'default' | 'browse'
	const [showVehicleModal, setShowVehicleModal] = useState(false);
	const [hasVehicle, setHasVehicle] = useState(false); 
	
	const [userLocation, setUserLocation] = useState(null);
	const [pickupCoords, setPickupCoords] = useState(null);
	const [dropoffCoords, setDropoffCoords] = useState(null);
	const [routePolyline, setRoutePolyline] = useState(null);

	// Browse mode states
	const [nearbyRides, setNearbyRides] = useState([]);
	const [loadingNearby, setLoadingNearby] = useState(false);
	const [selectedRide, setSelectedRide] = useState(null);

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
					console.warn("Geolocation permission denied or unavailable:", err.message);
					// Default fallback coordinates: Kolkata
					const defaultCoords = [22.5726, 88.3639];
					setUserLocation(defaultCoords);
					setPickupCoords(defaultCoords);
				},
				{ enableHighAccuracy: true, timeout: 10000 }
			);
		} else {
			const defaultCoords = [22.5726, 88.3639];
			setUserLocation(defaultCoords);
			setPickupCoords(defaultCoords);
		}
	}, []);

	// Check if user already has a vehicle registered
	useEffect(() => {
		const user = JSON.parse(localStorage.getItem("user") || "{}");
		if (user.is_vehicle_registered === "1" || user.is_vehicle_registered === "2") {
			setHasVehicle(true);
		}
	}, []);

	const handlePublishRide = () => {
		if (!hasVehicle) {
			setShowVehicleModal(true);
		} else {
			alert("Opening Publish Ride Form (Coming Soon!)");
		}
	};

	const handleRegisterVehicle = async (vehicleData) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch("/register-vehicle", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(vehicleData)
			});
			const data = await res.json();
			if (data.success) {
				setHasVehicle(true);
				setShowVehicleModal(false);
				const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
				storedUser.is_vehicle_registered = "2";
				localStorage.setItem("user", JSON.stringify(storedUser));
				alert("Vehicle registered successfully! You can now publish rides.");
			} else {
				alert("Vehicle registration failed: " + (data.message || "Please check details"));
			}
		} catch (err) {
			console.error("Error registering vehicle:", err);
			alert("Error registering vehicle. Please try again.");
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
			const lat = userLocation ? userLocation[0] : 22.5726;
			const lng = userLocation ? userLocation[1] : 88.3639;
			const res = await fetch(`/book-ride/nearby?lat=${lat}&lng=${lng}&radius=10`, {
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			});
			const data = await res.json();
			if (data.success && data.rides) {
				setNearbyRides(data.rides);
				if (data.rides.length > 0) {
					setSelectedRide(data.rides[0]);
				}
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

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col w-full text-left">
			<Header onOpenVehicleModal={() => setShowVehicleModal(true)} />

			{/* Main Content Area */}
			<main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
				<div className="relative flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch transition-all duration-500 ease-in-out">
					{viewMode === "browse" ? (
						<>
							{/* BROWSE MODE: Available Rides on Left */}
							<div className="w-full lg:w-[48%] h-[680px] transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-left-6">
								<BrowseRidesPanel 
									rides={nearbyRides}
									loading={loadingNearby}
									selectedRide={selectedRide}
									onSelectRide={setSelectedRide}
									onBack={handleBackToSearch}
									userLocation={userLocation}
									onRideBooked={(rideId) => {
										setNearbyRides((prev) =>
											prev.map((r) =>
												r.ride_id === rideId
													? { ...r, available_seats: Math.max(0, r.available_seats - 1) }
													: r
											)
										);
									}}
								/>
							</div>

							{/* BROWSE MODE: Map on Right */}
							<div className="w-full lg:w-[52%] h-[680px] transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-right-6">
								<MapPlaceholder 
									pickupCoords={pickupCoords} 
									dropoffCoords={dropoffCoords} 
									routePolyline={routePolyline}
									userLocation={userLocation}
									viewMode={viewMode}
									nearbyRides={nearbyRides}
									selectedRide={selectedRide}
									onSelectRide={setSelectedRide}
								/>
							</div>
						</>
					) : (
						<>
							{/* DEFAULT MODE: Map on Left */}
							<div className="w-full lg:w-2/3 h-[640px] transition-all duration-500 ease-in-out">
								<MapPlaceholder 
									pickupCoords={pickupCoords} 
									dropoffCoords={dropoffCoords} 
									routePolyline={routePolyline}
									userLocation={userLocation}
									viewMode={viewMode}
								/>
							</div>

							{/* DEFAULT MODE: Search / Ride Actions on Right */}
							<div className="w-full lg:w-1/3 transition-all duration-500 ease-in-out">
								<RideActions 
									onPublishRide={handlePublishRide} 
									onLocationUpdate={handleLocationUpdate}
									pickupCoords={pickupCoords}
									dropoffCoords={dropoffCoords}
									userLocation={userLocation}
									onSearchRoute={setRoutePolyline}
									onBrowseRides={handleBrowseRides}
								/>
							</div>
						</>
					)}
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-white border-t border-gray-200 py-6 mt-auto">
				<div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
					© {new Date().getFullYear()} MakeLyft. Powered by Odoo.
				</div>
			</footer>

			{/* Floating AI Assistant */}
			<AIAssistant />

			{/* Modals */}
			{showVehicleModal && (
				<VehicleRegistrationModal
					onClose={() => setShowVehicleModal(false)}
					onRegister={handleRegisterVehicle}
				/>
			)}
		</div>
	);
}

export default Dashboard;

