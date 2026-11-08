const express = require("express");
const router = express.Router();
const db = require("../handlers/dbHandler");

// GET /history/driver
// Get history of rides published by the user
router.get("/driver", async (req, res, next) => {
	try {
		if (!req.user || !req.user.emp_id) {
			return res.status(401).json({ success: false, message: "Unauthorized." });
		}
		const userId = req.user.emp_id;

		const query = `
            SELECT r.*, v.vehicle_model,
                   (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.ride_id) as booked_seats_count
            FROM rides r 
            LEFT JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.driver_id = $1 
            ORDER BY r.departure_time DESC
        `;
		const { rows } = await db.query(query, [userId]);

		return res.json({ success: true, history: rows });
	} catch (error) {
		console.error("Error fetching driver history:", error);
		return next(error);
	}
});

// GET /history/passenger
// Get history of rides booked by the user
router.get("/passenger", async (req, res, next) => {
	try {
		if (!req.user || !req.user.emp_id) {
			return res.status(401).json({ success: false, message: "Unauthorized." });
		}
		const userId = req.user.emp_id;

		const query = `
            SELECT b.booking_id, b.booking_status, b.payment_status, b.otp, b.fare_amount,
                   b.luggage_size, b.passenger_notes, b.selected_stopover, b.created_at as booking_date,
                   r.ride_id, r.origin, r.destination, r.departure_time, r.fare_per_seat, r.subsidy_per_seat,
                   r.status as ride_status, r.destination_tech_park, r.is_female_only,
                   u.name as driver_name, u.email as driver_email, u.phone as driver_phone,
                   u.org_name as driver_company, u.driving_rating,
                   v.vehicle_model
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            JOIN users u ON r.driver_id = u.emp_id
            LEFT JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE b.passenger_id = $1
            ORDER BY b.created_at DESC
        `;
		const { rows } = await db.query(query, [userId]);

		return res.json({ success: true, history: rows });
	} catch (error) {
		console.error("Error fetching passenger history:", error);
		return next(error);
	}
});

module.exports = router;
