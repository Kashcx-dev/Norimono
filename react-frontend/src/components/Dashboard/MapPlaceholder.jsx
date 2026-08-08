import React from "react";
import Map from "./Map.jsx";

function MapPlaceholder({ pickupCoords, dropoffCoords, routePolyline, userLocation }) {
	return (
		<div className="w-full h-[600px] bg-gray-100 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
			<Map 
				pickupCoords={pickupCoords} 
				dropoffCoords={dropoffCoords} 
				routePolyline={routePolyline}
				userLocation={userLocation}
			/>
		</div>
	);
}

export default MapPlaceholder;
