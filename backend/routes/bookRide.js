const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const crypto = require('crypto');

router.post('/', async (req, res, next) => {
    try {
        const { ride_id, pickup_location, dropoff_location } = req.body;

        // Ensure user is authenticated
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const passenger_id = req.user.emp_id;

        // Validate payload
        if (!ride_id || !pickup_location || !dropoff_location) {
            return res.status(400).json({ message: "Missing required fields: ride_id, pickup_location, dropoff_location." });
        }

        // Check if the ride exists and has available seats, and if it's in the same organization
        const rideResult = await db.query(
            `SELECT r.available_seats, r.driver_id, u.org_name 
             FROM rides r
             JOIN users u ON r.driver_id = u.emp_id
             WHERE r.ride_id = $1`, 
            [ride_id]
        );

        if (!rideResult.rows || rideResult.rows.length === 0) {
            return res.status(404).json({ message: "Ride not found." });
        }

        const ride = rideResult.rows[0];

        if (ride.driver_id === passenger_id) {
            return res.status(400).json({ message: "You cannot book your own published ride." });
        }

        if (ride.org_name !== req.user.org_name) {
            return res.status(403).json({ message: "You can only book rides within your own organization." });
        }

        if (ride.available_seats <= 0) {
            return res.status(400).json({ message: "Sorry, this ride is fully booked!" });
        }

        // Decrement available seats by 1
        await db.query(
            'UPDATE rides SET available_seats = available_seats - 1 WHERE ride_id = $1',
            [ride_id]
        );

        // Generate a 4-digit OTP for the driver to verify pickup
        const otp = crypto.randomInt(1000, 9999).toString();

        // Insert booking into the bookings table
        const insertQuery = `
            INSERT INTO bookings (
                ride_id, passenger_id, pickup_location, 
                dropoff_location, booking_status, payment_status, otp
            ) 
            VALUES ($1, $2, $3, $4, 'pending', 'pending', $5) 
            RETURNING booking_id
        `;
        
        const insertResult = await db.query(insertQuery, [
            ride_id, 
            passenger_id, 
            pickup_location, 
            dropoff_location, 
            otp
        ]);

        const io = req.app.get("socketio");
        if (io) {
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            
            // Emit notification to driver
            io.emit('new_notification', {
                target_emp_id: ride.driver_id,
                title: "New Ride Request",
                message: `${req.user.name || 'A passenger'} wants to join your ride.`,
                type: "request",
                timestamp: new Date().toISOString()
            });
        }

        return res.json({ 
            success: true, 
            message: 'Ride booked successfully!',
            booking_id: insertResult.rows[0].booking_id,
            pickup_otp: otp
        });

    } catch (error) {
        console.error("Error booking ride:", error);
        return next(error);
    }
});

module.exports = router;