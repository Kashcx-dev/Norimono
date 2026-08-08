import React from "react";
// import { Map as MapIcon } from "lucide-react";
import Map from "./Map.jsx";

function MapPlaceholder() {
	return (
		<div className="w-full h-150 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
			<div className="absolute inset-0 bg-radial-gradient from-transparent to-gray-50/50 pointer-events-none"></div>
			{/* <Map className="w-16 h-16 mb-4 text-[#714B67]/40" />
			<h3 className="text-xl font-semibold text-gray-600">
				Multipurpose Map Area
			</h3>
			<p className="text-sm mt-2 text-center max-w-xs">
				Map integration will be displayed here for real-time tracking and
				route selection.
			</p> */}
			<Map />
		</div>
	);
}

export default MapPlaceholder;
