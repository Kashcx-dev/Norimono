const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { deductAmt, creditAmt } = require('../handlers/WalletHandler');
const { stopLiveTracking } = require('./GPS_fetch');

router.post('/', async (req, res, next) => {
    try {
        const { ride_id } = req.body;
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        
        if (!ride_id) {
            return res.status(400).json({ message: "ride_id is required" });
        }

        const driver_id = req.user.emp_id;
        
        // Start Atomic Transaction with Row-Level Lock to prevent double-settlement race conditions
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Verify the ride belongs to this driver and lock row FOR UPDATE
            const rideResult = await client.query(
                'SELECT driver_id, status, fare_per_seat, subsidy_per_seat, destination FROM rides WHERE ride_id = $1 FOR UPDATE', 
                [ride_id]
            );

            if (rideResult.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(404).json({ message: "Ride not found" });
            }

            const ride = rideResult.rows[0];
            
            if (ride.driver_id !== driver_id) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(403).json({ message: "You are not authorized to finish this ride" });
            }
            
            if (ride.status === 'completed') {
                await client.query('ROLLBACK');
                client.release();
                return res.status(400).json({ message: "Ride is already completed" });
            }

            const fare = parseFloat(ride.fare_per_seat || 0);
            const subsidy = parseFloat(ride.subsidy_per_seat || 0);

            // 2. Find all active or completed bookings for this ride
            const bookingsResult = await client.query(
                `SELECT booking_id, passenger_id, booking_status, payment_status, fare_amount FROM bookings 
                 WHERE ride_id = $1 AND booking_status IN ('confirmed', 'in_progress', 'completed')`,
                [ride_id]
            );

            const bookings = bookingsResult.rows;
            let total_driver_credit = 0;
            let total_company_subsidy = 0;

            // 3. Process each passenger that hasn't already settled
            for (const booking of bookings) {
                const bookingFare = parseFloat(booking.fare_amount || fare);

                if (booking.payment_status === 'paid_pending_confirmation') {
                    // Passenger was already deducted in /rides/passenger/pay; credit driver now
                    total_driver_credit += bookingFare;
                } else if (booking.payment_status !== 'paid' && booking.payment_status !== 'completed') {
                    // Deduct from passenger wallet
                    await deductAmt(
                        booking.passenger_id, 
                        bookingFare, 
                        client, 
                        ride_id, 
                        `Carpool Commute Ride #${ride_id} (Subsidized Fare)`
                    );
                    total_driver_credit += bookingFare;
                }

                // If company subsidy is active, credit corporate green subsidy to driver
                if (subsidy > 0) {
                    await creditAmt(
                        driver_id, 
                        subsidy, 
                        client, 
                        ride_id, 
                        'company_subsidy', 
                        `Company Green Commute Subsidy for Ride #${ride_id}`
                    );
                    total_company_subsidy += subsidy;
                }
                
                // Mark booking as fully completed and paid
                await client.query(
                    `UPDATE bookings 
                     SET booking_status = 'completed', payment_status = 'completed' 
                     WHERE booking_id = $1`,
                    [booking.booking_id]
                );
            }

            // 4. Credit the driver for the settled passenger fares
            if (total_driver_credit > 0) {
                await creditAmt(
                    driver_id, 
                    total_driver_credit, 
                    client, 
                    ride_id, 
                    'driver_earnings', 
                    `Passenger Fares for Commute Ride #${ride_id}`
                );
            }

            // 5. Mark the ride itself as completed
            await client.query(
                `UPDATE rides SET status = 'completed' WHERE ride_id = $1`,
                [ride_id]
            );

            await client.query('COMMIT');

            // Clear live GPS navigation loop
            stopLiveTracking(ride_id);

            // 6. Broadcast ride completion to passengers and driver via Socket.io
            const io = req.app.get("socketio");
            if (io) {
                const payload = { ride_id: Number(ride_id), status: 'completed' };
                io.to(`ride_${ride_id}`).emit('ride_finished', payload);
                io.emit('ride_finished', payload);
                io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');
            }
            
            return res.json({ 
                success: true, 
                message: "Ride completed successfully. Payments settled.",
                earnings: total_driver_credit + total_company_subsidy,
                fares_collected: total_driver_credit,
                company_subsidy: total_company_subsidy
            });

        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Error finishing ride:", error);
        return next(error);
    }
});

module.exports = router;
