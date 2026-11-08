const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const crypto = require('crypto');

router.post('/', async (req, res, next) => {
    const client = await db.getClient();
    try {
        const { ride_id, pickup_location, dropoff_location, luggage_size, passenger_notes, selected_stopover } = req.body;
        const requestedSeats = Math.max(1, parseInt(req.body.seats_count || 1));

        // Ensure user is authenticated
        if (!req.user || !req.user.emp_id) {
            client.release();
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        const passenger_id = req.user.emp_id;

        // Validate payload
        if (!ride_id || !pickup_location || !dropoff_location) {
            client.release();
            return res.status(400).json({ message: "Missing required fields: ride_id, pickup_location, dropoff_location." });
        }

        await client.query('BEGIN');

        // Check for duplicate active reservation by this passenger on this ride
        const dupCheck = await client.query(
            `SELECT booking_id FROM bookings 
             WHERE ride_id = $1 AND passenger_id = $2 AND booking_status IN ('confirmed', 'in_progress', 'pending')`,
            [ride_id, passenger_id]
        );

        if (dupCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(409).json({ message: "You already have an active seat reservation on this commute." });
        }

        // Check if the ride exists and fetch metadata (locks the row with FOR UPDATE to prevent concurrent booking)
        const rideResult = await client.query(
            `SELECT r.available_seats, r.driver_id, r.status, r.departure_time, r.fare_per_seat, r.subsidy_per_seat, r.allow_neighbor_companies, u.org_name 
             FROM rides r
             JOIN users u ON r.driver_id = u.emp_id
             WHERE r.ride_id = $1
             FOR UPDATE`, 
            [ride_id]
        );

        if (!rideResult.rows || rideResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: "Ride not found." });
        }

        const ride = rideResult.rows[0];

        if (ride.driver_id === passenger_id) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: "You cannot book your own published ride." });
        }

        // Allow booking if same company OR if ride allows neighbor tech companies
        if (ride.org_name !== req.user.org_name && !ride.allow_neighbor_companies) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(403).json({ message: "You can only book rides within your own organization or partner tech parks." });
        }

        // Ensure passenger wallet exists in wallets table
        await client.query(
            `INSERT INTO wallets (emp_id, balance) VALUES ($1, 500.00) ON CONFLICT (emp_id) DO NOTHING`,
            [passenger_id]
        );

        // Allow booking scheduled rides or en-route active rides
        if (ride.status !== 'scheduled' && ride.status !== 'in_progress') {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: `Cannot book ride: This ride is currently ${ride.status}.` });
        }

        const isEnRoute = ride.status === 'in_progress';
        const fareAmount = parseFloat(ride.fare_per_seat || 0);

        // Atomic seat decrement — only succeeds if requestedSeats are still available
        const seatResult = await client.query(
            'UPDATE rides SET available_seats = available_seats - $1 WHERE ride_id = $2 AND available_seats >= $1 RETURNING available_seats',
            [requestedSeats, ride_id]
        );

        if (seatResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: `Sorry, there are not enough available seats (requested: ${requestedSeats}).` });
        }

        // Generate a 4-digit OTP for the driver to verify pickup
        const otp = crypto.randomInt(1000, 9999).toString();

        // Insert booking into the bookings table with confirmed status for immediate pickup verification
        const insertQuery = `
            INSERT INTO bookings (
                ride_id, passenger_id, pickup_location, 
                dropoff_location, booking_status, payment_status, otp,
                fare_amount, is_en_route, luggage_size, passenger_notes, selected_stopover
            ) 
            VALUES ($1, $2, $3, $4, 'confirmed', 'pending', $5, $6, $7, $8, $9, $10) 
            RETURNING booking_id
        `;
        
        const insertResult = await client.query(insertQuery, [
            ride_id, 
            passenger_id, 
            pickup_location, 
            dropoff_location, 
            otp,
            fareAmount,
            isEnRoute,
            luggage_size || 'medium',
            passenger_notes || null,
            selected_stopover || null
        ]);

        await client.query('COMMIT');
        client.release();

        const io = req.app.get("socketio");
        if (io) {
            // Notify driver both on the ride room and on their personal user socket room
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            io.to(`user_${ride.driver_id}`).emit('driver_refresh_bookings', { ride_id: Number(ride_id) });
            io.emit('driver_refresh_bookings', { ride_id: Number(ride_id) });
            
            if (isEnRoute) {
                io.to(`ride_${ride_id}`).emit('en_route_pickup_alert', {
                    ride_id: Number(ride_id),
                    booking_id: insertResult.rows[0].booking_id,
                    passenger_id,
                    passenger_name: req.user.name,
                    pickup_location,
                    otp,
                    message: `⚡ En-route passenger ${req.user.name} booked a seat on your active commute route!`
                });
            }

            // Emit direct notification to driver
            io.to(`user_${ride.driver_id}`).emit('new_notification', {
                target_emp_id: ride.driver_id,
                title: isEnRoute ? "⚡ En-Route Pickup Request" : "New Ride Booking",
                message: isEnRoute
                    ? `${req.user.name || 'A colleague'} booked an en-route pickup on your active ride.`
                    : `${req.user.name || 'A passenger'} confirmed a seat in your carpool.`,
                type: "request",
                timestamp: new Date().toISOString()
            });

            // Emit seat count update globally so browse panels refresh live for all users
            io.emit('ride_seats_updated', {
                ride_id: Number(ride_id),
                available_seats: Number(seatResult.rows[0].available_seats)
            });
        }

        return res.json({ 
            success: true, 
            message: 'Ride booked successfully!',
            booking_id: insertResult.rows[0].booking_id,
            otp: otp,
            pickup_otp: otp
        });

    } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        client.release();
        console.error("Error booking ride:", error);
        return next(error);
    }
});

module.exports = router;