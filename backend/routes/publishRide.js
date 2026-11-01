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

        // Algorithmic Legal Pricing: Driver cannot manually set a custom fare.
        // Pure non-profit cost-sharing compliance based on distance, vehicle consumption, and seats.
        const orgRes = await db.query(
            "SELECT fuel_cost_per_km, travel_cost_per_km FROM org_settings WHERE org_name = $1",
            [req.user.org_name || 'Odoo']
        );
        const fuelCostPerKm = parseFloat(orgRes.rows[0]?.fuel_cost_per_km || 5.50);
        const travelSubsidy = parseFloat(orgRes.rows[0]?.travel_cost_per_km || 2.00);
        const fuelRatio = parseFloat(vehicle.fuel_consumption_ratio || 1.0);

        const oLat = parseFloat(origin.lat);
        const oLon = parseFloat(origin.lng || origin.lon);
        const dLat = parseFloat(destination.lat);
        const dLon = parseFloat(destination.lng || destination.lon);

        let distKm = 12.0;
        if (!isNaN(oLat) && !isNaN(oLon) && !isNaN(dLat) && !isNaN(dLon)) {
            distKm = Math.max(3.0, haversineDistance(oLat, oLon, dLat, dLon) * 1.3);
        }

        // Algorithmic fare calculation (strictly computed by system for legality)
        const algorithmicGrossFare = Math.round((distKm * fuelCostPerKm * fuelRatio) / total_seats);
        let subsidyPerSeat = Math.round(Math.min(algorithmicGrossFare * 0.45, (distKm * travelSubsidy) / total_seats));
        const algorithmicNetFare = Math.max(25, algorithmicGrossFare - subsidyPerSeat);

        const isFemaleOnly = req.body.is_female_only === true || req.body.is_female_only === 'true';
        const destinationTechPark = req.body.destination_tech_park || destination.name || 'Tech Park Campus';
        const targetArrivalTime = req.body.target_arrival_time || '08:50 AM';

        // BlaBlaCar Ride Preferences & En-route Stopovers
        const preferences = req.body.preferences || {
            chattiness: req.body.chattiness || "blabla", // 'bla' (quiet), 'blabla' (friendly), 'blablabla' (chatty)
            ac: req.body.ac !== false && req.body.ac !== 'false',
            smoking: req.body.smoking === true || req.body.smoking === 'true',
            music: req.body.music !== false && req.body.music !== 'false',
            luggage: req.body.luggage || "medium", // 'small', 'medium', 'large'
            max_two_back: req.body.max_two_back !== false && req.body.max_two_back !== 'false'
        };
        const stopovers = Array.isArray(req.body.stopovers) ? req.body.stopovers : [];
        const isRecurring = req.body.is_recurring === true || req.body.is_recurring === 'true';
        const instantBooking = req.body.instant_booking !== false && req.body.instant_booking !== 'false';

        // Insert the new ride into the database with algorithmic cost-share price & BlaBlaCar features
        const insertQuery = `
            INSERT INTO rides (
                driver_id, veh_no, origin, destination, 
                departure_time, total_seats, available_seats, 
                fare_per_seat, subsidy_per_seat, status, polyline,
                is_female_only, destination_tech_park, allow_neighbor_companies, target_arrival_time,
                preferences, stopovers, is_recurring, instant_booking
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10, $11, $12, TRUE, $13, $14, $15, $16, $17) 
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
            algorithmicNetFare, 
            subsidyPerSeat,
            polylineStr,
            isFemaleOnly,
            destinationTechPark,
            targetArrivalTime,
            JSON.stringify(preferences),
            JSON.stringify(stopovers),
            isRecurring,
            instantBooking
        ]);

        return res.json({ 
            success: true, 
            message: 'Ride published with algorithmic non-profit cost-sharing & BlaBlaCar preferences',
            ride_id: insertResult.rows[0].ride_id,
            fare_per_seat: algorithmicNetFare,
            gross_cost_share: algorithmicGrossFare,
            subsidy_per_seat: subsidyPerSeat,
            is_female_only: isFemaleOnly,
            destination_tech_park: destinationTechPark,
            preferences,
            stopovers,
            is_recurring: isRecurring,
            instant_booking: instantBooking
        });

    } catch (error) {
        console.error("Error publishing ride:", error);
        return next(error);
    }
});

module.exports = router;