const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { getRouting } = require('../handlers/GPS_CalcHandler');
const { haversineDistance } = require('../utils/geoUtils');

router.post('/', async (req, res, next) => {
    try {
        const { origin, destination, departure_time, fare_per_seat } = req.body;
        
        // Ensure user is authenticated (populated by FN_verifyTkn)
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const driver_EMP_ID = req.user.emp_id;

        // Basic validation
        if (!origin || !destination || !departure_time || !fare_per_seat) {
            return res.status(400).json({ message: "Missing required fields (origin, destination, departure_time, fare_per_seat)" });
        }

        // Checking if the user has a registered and approved vehicle
        const userResult = await db.query(
            "SELECT is_vehicle_registered, rider_type FROM users WHERE emp_id = $1",
            [driver_EMP_ID]
        );
        const userStatus = userResult.rows[0]?.is_vehicle_registered || '0';

        if (userStatus === '1') {
            return res.status(400).json({ 
                message: "Your driver verification is currently pending Administrator review. You will be able to publish rides once approved." 
            });
        }
        if (userStatus === '0') {
            return res.status(400).json({ 
                message: "You are registered as a passenger. Please register your vehicle credentials to offer rides." 
            });
        }

        const vehicleResult = await db.query(
            `SELECT v.veh_no, v.seating_capacity, u.is_vehicle_registered 
             FROM vehicles v 
             JOIN users u ON v.emp_id = u.emp_id 
             WHERE v.emp_id = $1`, 
            [driver_EMP_ID]
        );

        if (!vehicleResult.rows || vehicleResult.rows.length === 0) {
            return res.status(400).json({ message: "Vehicle is not registered. Please register a vehicle first." });
        }

        const vehicle = vehicleResult.rows[0];
        
        if (vehicle.is_vehicle_registered !== '2') {
            return res.status(400).json({ message: "Your vehicle registration is not yet approved." });
        }

        const veh_no = vehicle.veh_no;
        const total_seats = vehicle.seating_capacity;

        // Formating coordinates for OSRM: "longitude,latitude"
        const startStr = `${origin.lng},${origin.lat}`;
        const endStr = `${destination.lng},${destination.lat}`;

        // Get the route polyline from OSRM
        const routeCoords = await getRouting(startStr, endStr);
        let polylineStr = null;
        if (routeCoords) {
            polylineStr = JSON.stringify(routeCoords);
        }

        // Calculate corporate green commute subsidy per seat
        let subsidyPerSeat = parseFloat(req.body.subsidy_per_seat) || 0.00;
        if (subsidyPerSeat <= 0) {
            try {
                const orgRes = await db.query(
                    "SELECT travel_cost_per_km FROM org_settings WHERE org_name = $1",
                    [req.user.org_name || 'Odoo']
                );
                const travelSubsidy = parseFloat(orgRes.rows[0]?.travel_cost_per_km || 2.00);
                const oLat = parseFloat(origin.lat);
                const oLon = parseFloat(origin.lng || origin.lon);
                const dLat = parseFloat(destination.lat);
                const dLon = parseFloat(destination.lng || destination.lon);
                if (!isNaN(oLat) && !isNaN(oLon) && !isNaN(dLat) && !isNaN(dLon)) {
                    const distKm = haversineDistance(oLat, oLon, dLat, dLon) * 1.3;
                    subsidyPerSeat = Math.round(Math.min(parseFloat(fare_per_seat) * 0.45, (distKm * travelSubsidy) / total_seats));
                }
            } catch (e) {}
        }

        // Insert the new ride into the database
        const insertQuery = `
            INSERT INTO rides (
                driver_id, veh_no, origin, destination, 
                departure_time, total_seats, available_seats, 
                fare_per_seat, subsidy_per_seat, status, polyline
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10) 
            RETURNING ride_id
        `;
        
        const insertResult = await db.query(insertQuery, [
            driver_EMP_ID, 
            veh_no, 
            origin, // JSONB
            destination, // JSONB
            departure_time, 
            total_seats, 
            total_seats, // initially available = total
            fare_per_seat, 
            subsidyPerSeat,
            polylineStr
        ]);

        return res.json({ 
            success: true, 
            message: 'Ride published successfully',
            ride_id: insertResult.rows[0].ride_id,
            subsidy_per_seat: subsidyPerSeat
        });

    } catch (error) {
        console.error("Error publishing ride:", error);
        return next(error);
    }
});

module.exports = router;