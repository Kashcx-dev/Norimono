/**
 * Norimono Geographic & Spatial Matching Utilities
 * Computes Haversine distances, route corridor matching, and detour geometry.
 */

const EARTH_RADIUS_KM = 6371.0088;

/**
 * Calculates great-circle distance between two coordinates in kilometers (Haversine formula)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
        return Infinity;
    }
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Finds the closest point and index along a GeoJSON polyline [ [lon, lat], ... ] to a target point
 * @param {number} targetLat 
 * @param {number} targetLon 
 * @param {Array<[number, number]>} polylineCoords Array of [longitude, latitude] or [latitude, longitude]
 * @returns {{ minDistanceKm: number, closestIndex: number, closestPoint: [number, number] }}
 */
function findClosestPointOnPolyline(targetLat, targetLon, polylineCoords) {
    if (!Array.isArray(polylineCoords) || polylineCoords.length === 0) {
        return { minDistanceKm: Infinity, closestIndex: -1, closestPoint: null };
    }

    let minDistance = Infinity;
    let closestIndex = -1;
    let closestPoint = null;

    for (let i = 0; i < polylineCoords.length; i++) {
        const pt = polylineCoords[i];
        if (!pt || pt.length < 2) continue;

        // GeoJSON from OSRM is [longitude, latitude]
        // But some coordinates might be [latitude, longitude]
        let ptLon = pt[0];
        let ptLat = pt[1];

        // If coordinates were stored as [lat, lon], detect by range (Lat: -90..90, Lon: -180..180)
        // Standard check: In India, Lon is ~68..97, Lat is ~8..37
        if (Math.abs(pt[0]) <= 50 && Math.abs(pt[1]) > 50) {
            ptLat = pt[0];
            ptLon = pt[1];
        }

        const dist = haversineDistance(targetLat, targetLon, ptLat, ptLon);
        if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
            closestPoint = [ptLat, ptLon];
        }
    }

    return {
        minDistanceKm: parseFloat(minDistance.toFixed(2)),
        closestIndex,
        closestPoint
    };
}

/**
 * Evaluates whether a driver's route matches a passenger's requested pickup and drop-off
 * @param {{ lat: number, lng: number }} passengerPickup 
 * @param {{ lat: number, lng: number }} passengerDropoff 
 * @param {Array<[number, number]>|string} polyline Raw polyline JSON or array
 * @param {{ lat: number, lng: number }} origin Driver origin
 * @param {{ lat: number, lng: number }} destination Driver destination
 * @param {number} maxDetourKm Maximum acceptable walking / detour distance at either end (default 5km)
 * @returns {{ isMatch: boolean, pickupDistanceKm: number, dropoffDistanceKm: number, totalDetourKm: number, passengerTravelKm: number }}
 */
function matchRideCorridor(passengerPickup, passengerDropoff, polyline, origin, destination, maxDetourKm = 5.0) {
    let coords = polyline;
    if (typeof coords === 'string') {
        try {
            coords = JSON.parse(coords);
        } catch (e) {
            coords = [];
        }
    }

    const pLat = parseFloat(passengerPickup.lat ?? passengerPickup.latitude);
    const pLon = parseFloat(passengerPickup.lng ?? passengerPickup.lon ?? passengerPickup.longitude);
    const dLat = parseFloat(passengerDropoff.lat ?? passengerDropoff.latitude);
    const dLon = parseFloat(passengerDropoff.lng ?? passengerDropoff.lon ?? passengerDropoff.longitude);

    if (isNaN(pLat) || isNaN(pLon) || isNaN(dLat) || isNaN(dLon)) {
        return { isMatch: false };
    }

    // Direct distance for passenger's own requested trip
    const passengerDirectKm = haversineDistance(pLat, pLon, dLat, dLon);

    // If polyline exists, do full corridor progression check
    if (Array.isArray(coords) && coords.length > 1) {
        const pickupMatch = findClosestPointOnPolyline(pLat, pLon, coords);
        const dropMatch = findClosestPointOnPolyline(dLat, dLon, coords);

        // Check if both pickup and drop-off are within acceptable buffer
        const withinPickupRadius = pickupMatch.minDistanceKm <= maxDetourKm;
        const withinDropRadius = dropMatch.minDistanceKm <= maxDetourKm;

        // Ensure the ride goes in the correct direction (pickup occurs before drop-off along the polyline)
        const correctDirection = pickupMatch.closestIndex <= dropMatch.closestIndex;

        const totalDetour = pickupMatch.minDistanceKm + dropMatch.minDistanceKm;

        // Estimate distance passenger travels along the driver route
        let passengerTravelKm = 0;
        if (correctDirection && pickupMatch.closestIndex >= 0 && dropMatch.closestIndex >= 0) {
            for (let i = pickupMatch.closestIndex; i < dropMatch.closestIndex; i++) {
                const pt1 = coords[i];
                const pt2 = coords[i + 1];
                passengerTravelKm += haversineDistance(pt1[1], pt1[0], pt2[1], pt2[0]);
            }
        }
        if (passengerTravelKm === 0) passengerTravelKm = passengerDirectKm;

        const isMatch = withinPickupRadius && withinDropRadius && correctDirection;

        return {
            isMatch,
            pickupDistanceKm: pickupMatch.minDistanceKm,
            dropoffDistanceKm: dropMatch.minDistanceKm,
            totalDetourKm: parseFloat(totalDetour.toFixed(2)),
            passengerTravelKm: parseFloat(passengerTravelKm.toFixed(2)),
            pickupIndex: pickupMatch.closestIndex,
            dropoffIndex: dropMatch.closestIndex
        };
    }

    // Fallback: If polyline is missing, check direct distance to driver's origin and destination
    if (origin && destination) {
        const oLat = parseFloat(origin.lat);
        const oLon = parseFloat(origin.lng ?? origin.lon);
        const destLat = parseFloat(destination.lat);
        const destLon = parseFloat(destination.lng ?? destination.lon);

        const pickupDist = haversineDistance(pLat, pLon, oLat, oLon);
        const dropDist = haversineDistance(dLat, dLon, destLat, destLon);

        const isMatch = pickupDist <= maxDetourKm && dropDist <= maxDetourKm;
        return {
            isMatch,
            pickupDistanceKm: parseFloat(pickupDist.toFixed(2)),
            dropoffDistanceKm: parseFloat(dropDist.toFixed(2)),
            totalDetourKm: parseFloat((pickupDist + dropDist).toFixed(2)),
            passengerTravelKm: parseFloat(passengerDirectKm.toFixed(2))
        };
    }

    return { isMatch: false };
}

module.exports = {
    haversineDistance,
    findClosestPointOnPolyline,
    matchRideCorridor
};

