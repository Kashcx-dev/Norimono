const { getRouting } = require('../handlers/GPS_CalcHandler');

// Store active intervals so we can clear them if needed
const activeRides = {};

function formatLonLat(pt) {
    if (!pt) return null;
    if (Array.isArray(pt) && pt.length >= 2) {
        let a = parseFloat(pt[0]);
        let b = parseFloat(pt[1]);
        if (isNaN(a) || isNaN(b)) return null;
        // In OSRM, format is "lon,lat". If |a| > 50, a is longitude; otherwise b is longitude
        if (Math.abs(a) > 50) return `${a},${b}`;
        return `${b},${a}`;
    }
    if (typeof pt === 'object' && pt !== null) {
        const lat = parseFloat(pt.lat ?? pt.latitude);
        const lon = parseFloat(pt.lng ?? pt.lon ?? pt.longitude);
        if (!isNaN(lat) && !isNaN(lon)) return `${lon},${lat}`;
    }
    return null;
}

async function startLiveTracking(io, ride_id, startCoords, endCoords, tripPhase) {
    if (!ride_id) return;

    // Prevent duplicate tracking loops for the same ride
    if (activeRides[ride_id]) {
        clearInterval(activeRides[ride_id]);
    }

    const startStr = formatLonLat(startCoords);
    const endStr = formatLonLat(endCoords);

    if (!startStr || !endStr) {
        console.warn("[GPS] Missing valid coordinates for ride tracking:", startCoords, endCoords);
        return;
    }

    // Fetch the route coordinates between start and end
    const routeCoords = await getRouting(startStr, endStr);

    if (!routeCoords || routeCoords.length === 0) {
        console.error("[GPS] Failed to get routing for GPS tracking on ride", ride_id);
        return;
    }

    let currentIndex = 0;

    activeRides[ride_id] = setInterval(() => {
        // Stop moving when we reach the end of the array
        if (currentIndex >= routeCoords.length) {
            clearInterval(activeRides[ride_id]);
            delete activeRides[ride_id];
            
            const arrivedPayload = {
                ride_id: Number(ride_id),
                status: 'Arrived', 
                phase: tripPhase,
                currentLocation: routeCoords[routeCoords.length - 1]
            };
            io.to(`ride_${ride_id}`).emit('location_update', arrivedPayload);
            io.emit('location_update', arrivedPayload);
            return;
        }

        // Emit the live GPS coordinate to the ride room and globally
        const updatePayload = {
            ride_id: Number(ride_id),
            status: 'Moving',
            phase: tripPhase,
            currentLocation: routeCoords[currentIndex] 
        };
        io.to(`ride_${ride_id}`).emit('location_update', updatePayload);
        io.emit('location_update', updatePayload);

        currentIndex++;
    }, 2000); // Advance vehicle along route every 2 seconds for a smooth live demo
}

function stopLiveTracking(ride_id) {
    if (activeRides[ride_id]) {
        clearInterval(activeRides[ride_id]);
        delete activeRides[ride_id];
        console.log(`[GPS] Stopped tracking for ride ${ride_id}`);
    }
}

module.exports = { startLiveTracking, stopLiveTracking };