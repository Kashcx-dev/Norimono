const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

router.post('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        // The driver provides the booking_id of the passenger they are dropping off
        const { booking_id } = req.body;
        const driver_id = req.user.emp_id;

        if(!booking_id){
            return res.status(400).json({message: "Need a booking_id to verify the drop-off."});
        }

        // Fetch the booking and join with the ride to ensure this driver actually owns the ride
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.booking_status, r.ride_id, r.driver_id, r.status AS ride_status
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1
        `, [booking_id]);

        if(!bookingResult.rows || bookingResult.rows.length === 0){
            return res.status(404).json({message: "No such booking found."});
        }

        const bookingInfo = bookingResult.rows[0];

        // Verify the driver owns this ride
        if(bookingInfo.driver_id !== driver_id){
            return res.status(403).json({message: "You are not the driver for this ride."});
        }

        // Check if the booking is currently in_progress
        if(bookingInfo.booking_status !== "in_progress"){
            return res.status(400).json({message: `Booking is not currently in progress (Current state: ${bookingInfo.booking_status})`});
        }

        // Update the booking status to indicate the passenger has been dropped off
        await db.query(
            "UPDATE bookings SET booking_status = 'completed' WHERE booking_id = $1", 
            [booking_id]
        );

        // Optionally, check if all other active bookings for this ride are completed/cancelled.
        // If they are, we could mark the ride as 'completed' as well. 
        // For simplicity, we just complete the booking here.

        return res.json({
            success: true,
            message: "Passenger dropped off successfully! Booking completed."
        });

    } catch (error) {
        console.error("Error in dropPassenger:", error);
        return next(error);
    }
});

module.exports = router;
