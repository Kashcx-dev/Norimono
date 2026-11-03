/**
 * Norimono GeoService
 * Geocoding, reverse geocoding, and place search utilities
 */

/**
 * Robust place search using Photon (Komoot OSM) with Nominatim fallback
 * @param {string} query Search text
 * @param {[number, number]} userLoc Optional [lat, lon] bias
 * @returns {Promise<Array<{title: string, subtitle: string, fullAddress: string, coords: [number, number]}>>}
 */
export async function fetchPlaceSuggestions(query, userLoc) {
	if (!query || query.trim().length < 2) return [];

	// 1. Try Photon with user location bias
	try {
		let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=6`;
		if (userLoc && userLoc.length === 2) {
			url += `&lat=${userLoc[0]}&lon=${userLoc[1]}`;
		}
		const res = await fetch(url);
		const data = await res.json();
		if (data && data.features && data.features.length > 0) {
			return data.features.map((f) => {
				const p = f.properties;
				const main = p.name || p.street || p.city || "Location";
				const parts = [
					p.street,
					p.city || p.town || p.district,
					p.state,
					p.country,
				].filter(Boolean);
				const sub = parts.join(", ");
				return {
					title: main,
					subtitle: sub,
					fullAddress: main + (sub ? `, ${sub}` : ""),
					coords: [f.geometry.coordinates[1], f.geometry.coordinates[0]], // [lat, lon]
				};
			});
		}
	} catch (err) {
		console.warn("Photon search failed, falling back to Nominatim", err);
	}

	// 2. Fallback to Nominatim
	try {
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`,
		);
		const data = await res.json();
		if (data && data.length > 0) {
			return data.map((item) => ({
				title: item.display_name.split(",")[0],
				subtitle: item.display_name.split(",").slice(1, 4).join(","),
				fullAddress: item.display_name,
				coords: [parseFloat(item.lat), parseFloat(item.lon)],
			}));
		}
	} catch (err) {
		console.error("Nominatim search failed", err);
	}

	return [];
}

/**
 * Reverse geocode GPS coordinates specifically within India
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{success: boolean, address?: string, city?: string, state?: string, error?: string}>}
 */
export async function reverseGeocodeIndia(lat, lon) {
	// Latitude & Longitude bounding box for India (approx 6.5N - 37.5N, 68.0E - 97.5E)
	const isInsideIndia = lat >= 6.5 && lat <= 37.5 && lon >= 68.0 && lon <= 97.5;
	if (!isInsideIndia) {
		return {
			success: false,
			error: "Location detected is outside India. Norimono is exclusively available within Indian tech corridors."
		};
	}

	try {
		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&countrycodes=in&zoom=16&addressdetails=1`;
		const res = await fetch(url, { headers: { "Accept-Language": "en" } });
		if (!res.ok) throw new Error("Reverse geocode request failed");
		const data = await res.json();

		if (data && data.address) {
			const addr = data.address;
			// Ensure country is India
			if (addr.country_code && addr.country_code.toLowerCase() !== "in") {
				return {
					success: false,
					error: "Location is outside India. Norimono is currently available exclusively for Indian office commutes."
				};
			}

			const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.road || "";
			const city = addr.city || addr.town || addr.municipality || addr.district || "";
			const state = addr.state || "";

			const shortParts = [suburb, city, state].filter(Boolean);
			const formatted = shortParts.length > 0 ? shortParts.join(", ") : data.display_name.split(",").slice(0, 3).join(", ");

			return {
				success: true,
				address: formatted,
				city,
				state,
				fullAddress: data.display_name,
				coords: [lat, lon]
			};
		}

		return {
			success: true,
			address: `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)} (India)`,
			coords: [lat, lon]
		};
	} catch (err) {
		console.warn("Reverse geocode failed:", err.message);
		return {
			success: true,
			address: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
			coords: [lat, lon]
		};
	}
}

/**
 * Place suggestions scoped strictly to India
 */
export async function fetchIndiaPlaceSuggestions(query) {
	if (!query || query.trim().length < 2) return [];

	try {
		const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&countrycodes=in&limit=6&addressdetails=1`;
		const res = await fetch(url, { headers: { "Accept-Language": "en" } });
		const data = await res.json();
		if (data && data.length > 0) {
			return data.map((item) => {
				const parts = item.display_name.split(",").map(p => p.trim());
				const title = parts[0];
				const subtitle = parts.slice(1, 4).join(", ");
				return {
					title,
					subtitle,
					fullAddress: `${title}${subtitle ? `, ${subtitle}` : ""}`,
					coords: [parseFloat(item.lat), parseFloat(item.lon)]
				};
			});
		}
	} catch (err) {
		console.warn("India place suggestions failed, trying fallback:", err);
		return fetchPlaceSuggestions(query + ", India");
	}

	return [];
}

/**
 * Calculates straight-line distance in kilometers between two points using the Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

