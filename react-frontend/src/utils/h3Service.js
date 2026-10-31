/**
 * Norimono Client-side H3 & A* Pathfinding Service
 * Interacts with backend /h3 endpoints and client h3-js utilities
 */

import * as h3 from "h3-js";

/**
 * Runs A* Pathfinding across the H3 hexagonal grid between two [lat, lng] points
 * @param {[number, number]} start 
 * @param {[number, number]} end 
 * @param {number} resolution (default 8)
 * @returns {Promise<{ path: Array<[number, number]>, hexPath: string[], distanceKm: number, boundaries: Array<Array<[number, number]>> }>}
 */
export async function fetchH3Path(start, end, resolution = 8) {
	try {
		const res = await fetch("/h3/pathfind", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ start, end, resolution })
		});
		const data = await res.json();
		if (!data.success) throw new Error(data.message || "Failed to compute H3 path");
		return data;
	} catch (err) {
		console.warn("H3 pathfinding endpoint failed, running fallback client-side calculation:", err);
		// Local client fallback using h3-js
		const startHex = h3.latLngToCell(start[0], start[1], resolution);
		const endHex = h3.latLngToCell(end[0], end[1], resolution);
		const gridPath = h3.gridPathCells(startHex, endHex);
		const path = gridPath.map(h => h3.cellToLatLng(h));
		const boundaries = gridPath.map(h => h3.cellToBoundary(h));
		return {
			path,
			hexPath: gridPath,
			hops: gridPath.length,
			distanceKm: parseFloat((gridPath.length * 0.9).toFixed(2)),
			boundaries
		};
	}
}

/**
 * Extracts H3 hexagonal corridor polygons along a route polyline
 * @param {Array<[number, number]>} polyline 
 * @param {number} resolution 
 * @param {number} buffer 
 */
export async function fetchH3Corridor(polyline, resolution = 8, buffer = 1) {
	try {
		const res = await fetch("/h3/corridor", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ polyline, resolution, buffer })
		});
		return await res.json();
	} catch (err) {
		console.warn("H3 corridor endpoint failed:", err);
		return null;
	}
}

/**
 * Converts an H3 cell index to Leaflet polygon boundary [ [lat, lng], ... ]
 */
export function getHexBoundary(hex) {
	return h3.cellToBoundary(hex);
}

/**
 * Converts a [lat, lng] coordinate to H3 cell index
 */
export function getHexFromCoord(lat, lng, resolution = 8) {
	return h3.latLngToCell(lat, lng, resolution);
}

