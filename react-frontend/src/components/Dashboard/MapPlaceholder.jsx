import React from "react";
import Map from "./Map.jsx";

function MapPlaceholder({
	pickupCoords,
	dropoffCoords,
	routePolyline,
	userLocation,
	viewMode = "default",
	nearbyRides = [],
	selectedRide = null,
	onSelectRide,
	activeTrip = null,
	h3Hexagons = [],
}) {
	return (
		<div className="w-full h-full relative overflow-hidden bg-slate-900">
			<Map 
				pickupCoords={pickupCoords} 
				dropoffCoords={dropoffCoords} 
				routePolyline={routePolyline}
				userLocation={userLocation}
				viewMode={viewMode}
				nearbyRides={nearbyRides}
				selectedRide={selectedRide}
				onSelectRide={onSelectRide}
				activeTrip={activeTrip}
				h3Hexagons={h3Hexagons}
			/>
		</div>
	);
}

export default MapPlaceholder;
