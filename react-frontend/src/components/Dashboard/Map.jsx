import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ pickupCoords, dropoffCoords, routePolyline, userLocation }) {
	const map = useMap();
	
	useEffect(() => {
		if (routePolyline && routePolyline.length > 0) {
			const bounds = L.latLngBounds(routePolyline);
			map.fitBounds(bounds, { padding: [50, 50] });
		} else if (pickupCoords && dropoffCoords) {
			const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
			map.fitBounds(bounds, { padding: [50, 50] });
		} else if (pickupCoords) {
			map.setView(pickupCoords, 14);
		} else if (dropoffCoords) {
			map.setView(dropoffCoords, 14);
		} else if (userLocation) {
			map.setView(userLocation, 14);
		}
	}, [pickupCoords, dropoffCoords, routePolyline, userLocation, map]);

	return null;
}

export default function Map({ pickupCoords, dropoffCoords, routePolyline, userLocation }) {
	// Fallback coordinates: Kolkata
	const defaultPosition = [22.5726, 88.3639]; 
	const initialCenter = userLocation || pickupCoords || defaultPosition;

	return (
		<div className="relative z-0 h-full w-full overflow-hidden shadow-md">
			<MapContainer
				center={initialCenter}
				zoom={13}
				scrollWheelZoom={true}
				className="h-full w-full"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				
				<MapUpdater 
					pickupCoords={pickupCoords} 
					dropoffCoords={dropoffCoords} 
					routePolyline={routePolyline}
					userLocation={userLocation}
				/>

				{/* User's current location marker (shown when no specific search is happening) */}
				{userLocation && !pickupCoords && !dropoffCoords && (
					<Marker position={userLocation}>
						<Popup>
							<div className="font-semibold text-sm">📍 Your Current Location</div>
						</Popup>
					</Marker>
				)}

				{/* Source Marker */}
				{pickupCoords && (
					<Marker position={pickupCoords}>
						<Popup>
							<div className="font-semibold text-sm text-[#00A09D]">🟢 Pickup Location (Source)</div>
						</Popup>
					</Marker>
				)}
				
				{/* Destination Marker */}
				{dropoffCoords && (
					<Marker position={dropoffCoords}>
						<Popup>
							<div className="font-semibold text-sm text-[#EF4444]">🔴 Dropoff Location (Destination)</div>
						</Popup>
					</Marker>
				)}

				{/* Route Polyline (drawn when user searches) */}
				{routePolyline && (
					<Polyline 
						positions={routePolyline} 
						pathOptions={{ color: '#714B67', weight: 5, opacity: 0.85 }} 
					/>
				)}
				
				{/* Default fallback marker if no GPS permission and no points */}
				{!userLocation && !pickupCoords && !dropoffCoords && (
					<Marker position={defaultPosition}>
						<Popup>MakeLyft Hub</Popup>
					</Marker>
				)}
			</MapContainer>
		</div>
	);
}
