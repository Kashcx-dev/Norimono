import React, { useEffect } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	Polyline,
	Circle,
	useMap,
} from "react-leaflet";
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

// Custom stylish HTML markers
const createCarIcon = (isSelected, name, fare) => {
	const bg = isSelected ? "#00A09D" : "#714B67";
	const scale = isSelected ? "scale(1.15)" : "scale(1)";
	return L.divIcon({
		className: "custom-car-marker",
		html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%) ${scale};
        transition: transform 0.2s ease;
        cursor: pointer;
      ">
        <div style="
          background: ${bg};
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border: 2px solid white;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>🚗</span>
          <span>${name || "Carpool"}</span>
          <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 6px; font-size: 10px;">₹${fare || 45}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${bg};
        "></div>
      </div>
    `,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
};

const createUserLocationIcon = () => {
	return L.divIcon({
		className: "custom-user-marker",
		html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -50%);
      ">
        <div style="
          position: relative;
          width: 22px;
          height: 22px;
          background: #00A09D;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(0,160,157,0.35), 0 4px 10px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
		iconSize: [0, 0],
		iconAnchor: [0, 0],
	});
};

function MapUpdater({
	pickupCoords,
	dropoffCoords,
	routePolyline,
	userLocation,
	viewMode,
	selectedRide,
	nearbyRides,
}) {
	const map = useMap();

	// Resize map when layout splits / animates
	useEffect(() => {
		const timer = setTimeout(() => {
			map.invalidateSize();
		}, 350);
		return () => clearTimeout(timer);
	}, [viewMode, map]);

	useEffect(() => {
		if (selectedRide && selectedRide.origin && selectedRide.destination) {
			const p1 = [selectedRide.origin.lat, selectedRide.origin.lng];
			const p2 = [
				selectedRide.destination.lat,
				selectedRide.destination.lng,
			];
			const bounds = L.latLngBounds([p1, p2]);
			map.fitBounds(bounds, { padding: [60, 60] });
		} else if (routePolyline && routePolyline.length > 0) {
			const bounds = L.latLngBounds(routePolyline);
			map.fitBounds(bounds, { padding: [50, 50] });
		} else if (viewMode === "browse" && userLocation) {
			// In browse mode with 10km circle, fit around 10km bounds
			map.setView(userLocation, 12);
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
	}, [
		pickupCoords,
		dropoffCoords,
		routePolyline,
		userLocation,
		viewMode,
		selectedRide,
		map,
	]);

	return null;
}

export default function Map({
	pickupCoords,
	dropoffCoords,
	routePolyline,
	userLocation,
	viewMode = "default",
	nearbyRides = [],
	selectedRide = null,
	onSelectRide,
}) {
	// Fallback coordinates: Kolkata
	const defaultPosition = [22.5726, 88.3639];
	const initialCenter = userLocation || pickupCoords || defaultPosition;

	return (
		<div className="relative z-0 h-full w-full overflow-hidden">
			<MapContainer
				center={initialCenter}
				zoom={viewMode === "browse" ? 12 : 13}
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
					viewMode={viewMode}
					selectedRide={selectedRide}
					nearbyRides={nearbyRides}
				/>

				{/* 10km Radius Geofence Circle (Browse Mode) */}
				{viewMode === "browse" && userLocation && (
					<Circle
						center={userLocation}
						radius={10000} // 10,000 meters = 10km
						pathOptions={{
							color: "#00A09D",
							fillColor: "#00A09D",
							fillOpacity: 0.08,
							weight: 2,
							dashArray: "6, 8",
						}}
					>
						<Popup>
							<div className="text-xs font-bold text-[#00A09D]">
								📍 10km Radius Carpool Zone
							</div>
						</Popup>
					</Circle>
				)}

				{/* User's Location Marker */}
				{userLocation && (
					<Marker position={userLocation} icon={createUserLocationIcon()}>
						<Popup>
							<div className="font-bold text-xs text-[#00A09D] p-1">
								📍 You are here
							</div>
						</Popup>
					</Marker>
				)}

				{/* Nearby Ride Markers (Browse Mode) */}
				{viewMode === "browse" &&
					nearbyRides.map((ride) => {
						if (!ride.origin?.lat || !ride.origin?.lng) return null;
						const isSelected = selectedRide?.ride_id === ride.ride_id;
						const pos = [ride.origin.lat, ride.origin.lng];

						return (
							<Marker
								key={ride.ride_id}
								position={pos}
								icon={createCarIcon(
									isSelected,
									ride.driver_name,
									ride.fare_per_seat,
								)}
								eventHandlers={{
									click: () => onSelectRide && onSelectRide(ride),
								}}
							>
								<Popup>
									<div className="text-xs space-y-1.5 p-1 text-left min-w-[170px]">
										<div className="flex items-center justify-between border-b border-gray-100 pb-1">
											<span className="font-bold text-gray-900">
												{ride.driver_name}
											</span>
											<span className="text-[#00A09D] font-extrabold">
												₹{ride.fare_per_seat}
											</span>
										</div>
										<p className="text-gray-600">
											<strong>Vehicle:</strong> {ride.vehicle_model}
										</p>
										<p className="text-gray-600">
											<strong>Destination:</strong>{" "}
											{ride.destination?.name}
										</p>
										<p className="text-[#00A09D] font-semibold">
											{ride.distance_km} km away •{" "}
											{ride.available_seats} seats left
										</p>
										<button
											onClick={() =>
												onSelectRide && onSelectRide(ride)
											}
											className="w-full mt-1.5 py-1 px-2 bg-[#00A09D] text-white font-bold rounded text-[11px] cursor-pointer"
										>
											Select Carpool
										</button>
									</div>
								</Popup>
							</Marker>
						);
					})}

				{/* Selected Ride Destination Marker & Line */}
				{viewMode === "browse" && selectedRide?.destination?.lat && (
					<>
						<Marker
							position={[
								selectedRide.destination.lat,
								selectedRide.destination.lng,
							]}
						>
							<Popup>
								<div className="text-xs font-bold text-[#EF4444]">
									🏁 Destination: {selectedRide.destination.name}
								</div>
							</Popup>
						</Marker>
						<Polyline
							positions={[
								[selectedRide.origin.lat, selectedRide.origin.lng],
								[
									selectedRide.destination.lat,
									selectedRide.destination.lng,
								],
							]}
							pathOptions={{
								color: "#714B67",
								weight: 4,
								opacity: 0.8,
								dashArray: "4, 6",
							}}
						/>
					</>
				)}

				{/* Source Marker */}
				{pickupCoords && (
					<Marker position={pickupCoords}>
						<Popup>
							<div className="font-semibold text-sm text-[#00A09D]">
								🟢 Pickup Location (Source)
							</div>
						</Popup>
					</Marker>
				)}

				{/* Destination Marker */}
				{dropoffCoords && (
					<Marker position={dropoffCoords}>
						<Popup>
							<div className="font-semibold text-sm text-[#EF4444]">
								🔴 Dropoff Location (Destination)
							</div>
						</Popup>
					</Marker>
				)}

				{/* Route Polyline (Vibrant cyan/purple path) */}
				{routePolyline && (
					<Polyline
						positions={routePolyline}
						pathOptions={{ color: "#00A09D", weight: 6, opacity: 0.9 }}
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
