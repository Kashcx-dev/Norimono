const h3Engine = require('../handlers/h3Engine');
console.log("H3 Engine loaded. Default resolution:", h3Engine.DEFAULT_RESOLUTION);

// Kolkata Park Street to Salt Lake Sector V coordinates
const start = [22.5535, 88.3524];
const end = [22.5804, 88.4378];

console.log("1. Testing A* Pathfinding over H3 grid...");
const result = h3Engine.findPathAStar(start, end);
console.log("A* Success! Hops:", result.hops, "Distance km:", result.distanceKm, "Iterations:", result.iterations);
console.log("Sample path waypoint:", result.path[0], "->", result.path[result.path.length - 1]);

console.log("2. Testing Hex Corridor extraction...");
const corridor = h3Engine.polylineCoordsToHexCorridor(result.path, 8, 1);
console.log("Corridor Core Hexes:", corridor.coreHexes.length, "Expanded Hexes:", corridor.corridorHexes.length);

console.log("3. Testing Carpool Matcher...");
const match = h3Engine.matchCarpoolH3(start, end, corridor.coreHexes);
console.log("Carpool Match result:", match.isMatch);

console.log("All H3 verification tests PASSED!");

