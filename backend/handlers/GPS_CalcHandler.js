// Open Source Routing Machine (OSRM) Polyline Router & Route Telemetry

const axios = require('axios');

/**
 * Fetch full route details from OSRM: polyline coordinates, accurate road distance, and duration.
 * @param {string} start "longitude,latitude"
 * @param {string} end "longitude,latitude"
 * @returns {Promise<{coordinates: Array, distanceMeters: number, distanceKm: number, durationSeconds: number, durationMins: number}|null>}
 */
async function getRouteDetails(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
    try {
        const response = await axios.get(url, { timeout: 6000 });
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const distanceMeters = parseFloat(route.distance) || 0;
            const distanceKm = parseFloat((distanceMeters / 1000).toFixed(2));
            const durationSeconds = parseFloat(route.duration) || 0;
            const durationMins = Math.max(1, Math.round(durationSeconds / 60));

            return {
                coordinates: route.geometry?.coordinates || [],
                distanceMeters,
                distanceKm,
                durationSeconds,
                durationMins
            };
        }
        return null;
    } catch (error) {
        console.warn("[Warning] OSRM Routing service unavailable or timed out:", error.message);
        return null;
    }
}

/**
 * Returns an array of [longitude, latitude] arrays representing the road (backward compatibility)
 */
async function getRouting(start, end) {
    const details = await getRouteDetails(start, end);
    return details ? details.coordinates : null;
}

module.exports = { getRouting, getRouteDetails };
