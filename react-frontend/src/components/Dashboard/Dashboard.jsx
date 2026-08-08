import React, { useState, useEffect } from "react";
import Header from "./Header";
import MapPlaceholder from "./MapPlaceholder";
import RideActions from "./RideActions";
import VehicleRegistrationModal from "./VehicleRegistrationModal";
import AIAssistant from "./AIAssistant";

function Dashboard() {
	const [showVehicleModal, setShowVehicleModal] = useState(false);
	const [hasVehicle, setHasVehicle] = useState(false); 
	
	const [userLocation, setUserLocation] = useState(null);
	const [pickupCoords, setPickupCoords] = useState(null);
	const [dropoffCoords, setDropoffCoords] = useState(null);
	const [routePolyline, setRoutePolyline] = useState(null);

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
				},
				{ enableHighAccuracy: true, timeout: 10000 }
			);
		}
	}, []);

	// Check if user already has a vehicle registered
	useEffect(() => {
		const user = JSON.parse(sessionStorage.getItem("user") || "{}");
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
		const token = sessionStorage.getItem("token");
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
				alert("Application submitted to admin for review.");
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

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col w-full text-left">
			<Header onOpenVehicleModal={() => setShowVehicleModal(true)} />

			{/* Main Content */}
			<main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
				<div className="w-full lg:w-2/3">
					<MapPlaceholder 
						pickupCoords={pickupCoords} 
						dropoffCoords={dropoffCoords} 
						routePolyline={routePolyline}
						userLocation={userLocation}
					/>
				</div>

				<div className="w-full lg:w-1/3">
					<RideActions 
						onPublishRide={handlePublishRide} 
						onLocationUpdate={handleLocationUpdate}
						pickupCoords={pickupCoords}
						dropoffCoords={dropoffCoords}
						userLocation={userLocation}
						onSearchRoute={setRoutePolyline}
					/>
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
