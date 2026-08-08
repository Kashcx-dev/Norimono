const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

// GET /rides
// Fetch available scheduled rides for the user's organization
router.get('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id || !req.user.org_name) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        const org_name = req.user.org_name;
        
        // Optionally receive origin/destination query params to filter nearby (can be added later)
        // For now, we return all available rides in the user's organization, thsi keeps the best simplicity in the approach
        const query = `
            SELECT 
                r.ride_id, r.driver_id, r.veh_no, r.origin, r.destination, 
                r.departure_time, r.total_seats, r.available_seats, r.fare_per_seat, r.status,
                u.name as driver_name, u.passenger_rating, u.driving_rating,
                v.vehicle_model
            FROM rides r
            JOIN users u ON r.driver_id = u.emp_id
            JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.status = 'scheduled' 
              AND r.available_seats > 0
              AND u.org_name = $1
            ORDER BY r.departure_time ASC
        `;

        const result = await db.query(query, [org_name]);

        return res.json({
            success: true,
            rides: result.rows
        });
    } catch (err) {
        console.error("Error fetching rides:", err);
        return next(err);
    }
});

module.exports = router;
