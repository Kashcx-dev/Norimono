// Open Source Routing Machine (OSRM) Polyline Router

const axios = require('axios');

async function getRouting(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
    try {
        const response = await axios.get(url, { timeout: 6000 });
        // Returns an array of [longitude, latitude] arrays representing the road
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            return response.data.routes[0].geometry.coordinates;
        }
        return null;
    } catch (error) {
        console.warn("[Warning] OSRM Routing service unavailable or timed out:", error.message);
        return null;
    }
}

module.exports = { getRouting };
