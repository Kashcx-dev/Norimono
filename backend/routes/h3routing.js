/**
 * Norimono H3 Routing & Corridor Endpoints
 * Provides A* hexagonal pathfinding, commute corridor generation, and H3 carpool matching.
 */

const express = require('express');
const router = express.Router();
const h3Engine = require('../handlers/h3Engine');

/**
 * POST /h3/pathfind
 * Runs A* heuristic search across the H3 hexagonal grid between two coordinates
 * Body: { start: [lat, lng], end: [lat, lng], resolution?: number, obstacles?: string[] }
 */
router.post('/pathfind', (req, res, next) => {
    try {
        const { start, end, resolution, obstacles } = req.body;

        if (!start || !end || !Array.isArray(start) || !Array.isArray(end)) {
            return res.status(400).json({ 
                success: false, 
                message: "start and end must be [latitude, longitude] coordinate arrays." 
            });
        }

        const startPt = [parseFloat(start[0]), parseFloat(start[1])];
        const endPt = [parseFloat(end[0]), parseFloat(end[1])];

        if (isNaN(startPt[0]) || isNaN(startPt[1]) || isNaN(endPt[0]) || isNaN(endPt[1])) {
            return res.status(400).json({ success: false, message: "Invalid numeric coordinates." });
        }

        const resLevel = parseInt(resolution) || h3Engine.DEFAULT_RESOLUTION;
        const result = h3Engine.findPathAStar(startPt, endPt, obstacles || [], resLevel);

        return res.json({
            success: true,
            path: result.path,
            hexPath: result.hexPath,
            hops: result.hops,
            distanceKm: result.distanceKm,
            iterations: result.iterations,
            boundaries: result.boundaries
        });
    } catch (err) {
        console.error("H3 Pathfind Error:", err.message);
        return res.status(422).json({
            success: false,
            message: err.message
        });
    }
});

/**
 * POST /h3/corridor
 * Extracts hexagonal corridor tiles and polygon boundaries from an OSRM route polyline
 * Body: { polyline: Array, resolution?: number, buffer?: number }
 */
router.post('/corridor', (req, res, next) => {
    try {
        const { polyline, resolution, buffer } = req.body;

        if (!polyline) {
            return res.status(400).json({ success: false, message: "polyline array or GeoJSON string is required." });
        }

        let coords = polyline;
        if (typeof coords === 'string') {
            try {
                coords = JSON.parse(coords);
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid JSON polyline." });
            }
        }

        const resLevel = parseInt(resolution) || h3Engine.DEFAULT_RESOLUTION;
        const bufferK = parseInt(buffer) || 1;

        const corridor = h3Engine.polylineCoordsToHexCorridor(coords, resLevel, bufferK);

        return res.json({
            success: true,
            coreHexCount: corridor.coreHexes.length,
            corridorHexCount: corridor.corridorHexes.length,
            coreHexes: corridor.coreHexes,
            corridorHexes: corridor.corridorHexes,
            corridorBoundaries: corridor.corridorBoundaries
        });
    } catch (err) {
        console.error("H3 Corridor Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /h3/match
 * Verifies whether passenger pickup and drop-off lie along a driver's H3 corridor
 * Body: { passengerPickup: [lat, lng], passengerDropoff: [lat, lng], driverCoreHexes: string[], buffer?: number }
 */
router.post('/match', (req, res, next) => {
    try {
        const { passengerPickup, passengerDropoff, driverCoreHexes, buffer, resolution } = req.body;

        if (!passengerPickup || !passengerDropoff || !driverCoreHexes) {
            return res.status(400).json({ 
                success: false, 
                message: "passengerPickup, passengerDropoff, and driverCoreHexes are required." 
            });
        }

        const resLevel = parseInt(resolution) || h3Engine.DEFAULT_RESOLUTION;
        const bufferK = parseInt(buffer) || 1;

        const match = h3Engine.matchCarpoolH3(passengerPickup, passengerDropoff, driverCoreHexes, bufferK, resLevel);

        return res.json({
            success: true,
            ...match
        });
    } catch (err) {
        console.error("H3 Match Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

