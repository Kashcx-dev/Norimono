/**
 * Norimono H3 Spatial Engine — Uber H3 Hexagonal Grid & A* Pathfinding Module
 * 
 * Capabilities:
 * - A* pathfinding on H3 hexagonal grids for commuter routes
 * - Hexagonal commute corridor extraction from polyline coordinates
 * - O(1) set-based carpool match verification
 * - Hexagon polygon boundaries for Leaflet map rendering
 */

const h3 = require('h3-js');

// Default H3 resolution: 8 ≈ 461m edge length, ~0.74 km² area (ideal for city commute corridors)
// Resolution 9 ≈ 174m edge length (higher density / local streets)
const DEFAULT_RESOLUTION = 8;

/**
 * Great-circle distance between two [lat, lng] pairs in kilometers
 */
function distanceKm(latlng1, latlng2) {
    if (!latlng1 || !latlng2) return 0;
    return h3.greatCircleDistance(latlng1, latlng2, 'km');
}

/**
 * Convert [lat, lng] coordinate to H3 cell index
 */
function coordToHex(latlng, res = DEFAULT_RESOLUTION) {
    if (!latlng || isNaN(latlng[0]) || isNaN(latlng[1])) return null;
    return h3.latLngToCell(latlng[0], latlng[1], res);
}

/**
 * Convert H3 cell index back to center [lat, lng]
 */
function hexToCoord(hex) {
    return h3.cellToLatLng(hex);
}

/**
 * Get the 6 boundary vertices of an H3 cell for polygon rendering in Leaflet: [ [lat, lng], ... ]
 */
function hexToBoundary(hex) {
    return h3.cellToBoundary(hex);
}

/**
 * Converts a route polyline into an ordered sequence of unique H3 hexes and their k-ring corridor
 * @param {Array<[number, number]>} polyline - [ [lon, lat], ... ] or [ [lat, lon], ... ]
 * @param {number} res - H3 resolution
 * @param {number} bufferK - k-ring expansion around the route (e.g. 1 expands to adjacent hexagons)
 * @returns {{ coreHexes: string[], corridorHexes: string[], corridorBoundaries: Array<Array<[number, number]>> }}
 */
function polylineCoordsToHexCorridor(polyline, res = DEFAULT_RESOLUTION, bufferK = 1) {
    if (!Array.isArray(polyline) || polyline.length === 0) {
        return { coreHexes: [], corridorHexes: [], corridorBoundaries: [] };
    }

    const coreHexesSet = new Set();
    const orderedCoreHexes = [];

    for (const pt of polyline) {
        if (!pt || pt.length < 2) continue;
        let lat = pt[0];
        let lng = pt[1];

        // Detect if pt is [lon, lat] (GeoJSON format from OSRM)
        if (Math.abs(pt[0]) > 90 || (Math.abs(pt[0]) > 50 && Math.abs(pt[1]) <= 50)) {
            lng = pt[0];
            lat = pt[1];
        }

        const hex = h3.latLngToCell(lat, lng, res);
        if (hex && !coreHexesSet.has(hex)) {
            coreHexesSet.add(hex);
            orderedCoreHexes.push(hex);
        }
    }

    // Expand corridor with k-ring
    const corridorSet = new Set();
    for (const hex of orderedCoreHexes) {
        const ring = h3.gridDisk(hex, bufferK);
        for (const h of ring) {
            corridorSet.add(h);
        }
    }

    const corridorHexes = Array.from(corridorSet);
    const corridorBoundaries = corridorHexes.map(h => h3.cellToBoundary(h));

    return {
        coreHexes: orderedCoreHexes,
        corridorHexes,
        corridorBoundaries
    };
}

/**
 * A* Pathfinding on H3 hexagonal grid
 * @param {[number, number]} startLatLng - [lat, lng]
 * @param {[number, number]} endLatLng - [lat, lng]
 * @param {string[]} obstacles - Optional H3 hex indexes to avoid (restricted / blocked areas)
 * @param {number} res - H3 resolution
 * @returns {{ path: Array<[number, number]>, hexPath: string[], hops: number, distanceKm: number, iterations: number, boundaries: Array }}
 */
function findPathAStar(startLatLng, endLatLng, obstacles = [], res = DEFAULT_RESOLUTION) {
    const startHex = h3.latLngToCell(startLatLng[0], startLatLng[1], res);
    const endHex = h3.latLngToCell(endLatLng[0], endLatLng[1], res);

    if (!startHex || !endHex) {
        throw new Error("Invalid start or destination coordinates for H3 grid.");
    }

    const obstacleSet = new Set(obstacles);

    if (obstacleSet.has(startHex)) {
        throw new Error("Start position is inside an obstacle zone.");
    }
    if (obstacleSet.has(endHex)) {
        throw new Error("Destination position is inside an obstacle zone.");
    }

    // A* structures
    const openSet = new Set([startHex]);
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(startHex, 0);
    fScore.set(startHex, distanceKm(startLatLng, endLatLng));

    let iterations = 0;
    const MAX_ITERATIONS = 25000;

    while (openSet.size > 0) {
        iterations++;
        if (iterations > MAX_ITERATIONS) {
            throw new Error(`A* Pathfinding timeout: exceeded ${MAX_ITERATIONS} iterations.`);
        }

        // Pop node with lowest fScore
        let current = null;
        let minF = Infinity;
        for (const hex of openSet) {
            const f = fScore.get(hex) || Infinity;
            if (f < minF) {
                minF = f;
                current = hex;
            }
        }

        if (current === endHex) {
            // Reconstruct path
            const hexPath = [current];
            while (cameFrom.has(current)) {
                current = cameFrom.get(current);
                hexPath.push(current);
            }
            const orderedHexPath = hexPath.reverse();
            const pathCoords = orderedHexPath.map(hex => h3.cellToLatLng(hex));

            // Compute total distance
            let totalDist = 0;
            for (let i = 1; i < pathCoords.length; i++) {
                totalDist += distanceKm(pathCoords[i - 1], pathCoords[i]);
            }

            const boundaries = orderedHexPath.map(h => h3.cellToBoundary(h));

            return {
                success: true,
                path: pathCoords,
                hexPath: orderedHexPath,
                hops: orderedHexPath.length,
                distanceKm: parseFloat(totalDist.toFixed(2)),
                iterations,
                boundaries
            };
        }

        openSet.delete(current);
        const currentLatLng = h3.cellToLatLng(current);

        // Get adjacent 6 hexagonal neighbors
        const neighbors = h3.gridDisk(current, 1).filter(h => h !== current);

        for (const neighbor of neighbors) {
            if (obstacleSet.has(neighbor)) continue;

            const neighborLatLng = h3.cellToLatLng(neighbor);
            const stepCost = distanceKm(currentLatLng, neighborLatLng);
            const tentativeG = (gScore.get(current) || 0) + stepCost;
            const neighborG = gScore.has(neighbor) ? gScore.get(neighbor) : Infinity;

            if (tentativeG < neighborG) {
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeG);
                // Heuristic: Euclidean / Great Circle distance to destination
                fScore.set(neighbor, tentativeG + distanceKm(neighborLatLng, endLatLng));
                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                }
            }
        }
    }

    throw new Error("No feasible path found across the H3 grid between given endpoints.");
}

/**
 * Fast O(1) H3 Carpool Matcher
 * Evaluates whether passenger pickup & drop-off intersect the driver's H3 corridor in the correct progression
 */
function matchCarpoolH3(passengerPickup, passengerDropoff, driverCoreHexes, bufferK = 1, res = DEFAULT_RESOLUTION) {
    const pLat = parseFloat(passengerPickup[0] ?? passengerPickup.lat);
    const pLon = parseFloat(passengerPickup[1] ?? passengerPickup.lng ?? passengerPickup.lon);
    const dLat = parseFloat(passengerDropoff[0] ?? passengerDropoff.lat);
    const dLon = parseFloat(passengerDropoff[1] ?? passengerDropoff.lng ?? passengerDropoff.lon);

    const pHex = h3.latLngToCell(pLat, pLon, res);
    const dHex = h3.latLngToCell(dLat, dLon, res);

    if (!pHex || !dHex || !Array.isArray(driverCoreHexes) || driverCoreHexes.length === 0) {
        return { isMatch: false };
    }

    // Build index map of driver's core path: Hex -> Sequence Index
    const hexIndexMap = new Map();
    driverCoreHexes.forEach((hex, idx) => {
        hexIndexMap.set(hex, idx);
    });

    // Check closest match for pickup in k-ring
    const pRing = h3.gridDisk(pHex, bufferK);
    let pClosestIdx = -1;
    for (const h of pRing) {
        if (hexIndexMap.has(h)) {
            pClosestIdx = hexIndexMap.get(h);
            break;
        }
    }

    // Check closest match for drop-off in k-ring
    const dRing = h3.gridDisk(dHex, bufferK);
    let dClosestIdx = -1;
    for (const h of dRing) {
        if (hexIndexMap.has(h)) {
            dClosestIdx = hexIndexMap.get(h);
            break;
        }
    }

    const isMatch = pClosestIdx !== -1 && dClosestIdx !== -1 && pClosestIdx <= dClosestIdx;

    return {
        isMatch,
        pickupHex: pHex,
        dropoffHex: dHex,
        pickupIndex: pClosestIdx,
        dropoffIndex: dClosestIdx
    };
}

module.exports = {
    DEFAULT_RESOLUTION,
    distanceKm,
    coordToHex,
    hexToCoord,
    hexToBoundary,
    polylineCoordsToHexCorridor,
    findPathAStar,
    matchCarpoolH3
};

