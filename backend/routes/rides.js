const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const { deductAmt, creditAmt } = require('../handlers/WalletHandler');
const { matchRideCorridor, haversineDistance } = require('../utils/geoUtils');
const h3Engine = require('../handlers/h3Engine');

// GET /rides
// Fetch available scheduled rides for the user's organization with optional spatial corridor search
router.get('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id || !req.user.org_name) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        const org_name = req.user.org_name;
        const { 
            pickup_lat, pickup_lng, 
            dropoff_lat, dropoff_lng,
            origin_lat, origin_lng,
            dest_lat, dest_lng,
            max_detour_km,
            filter_corridor_only
        } = req.query;

        const pLat = parseFloat(pickup_lat || origin_lat);
        const pLon = parseFloat(pickup_lng || origin_lng);
        const dLat = parseFloat(dropoff_lat || dest_lat);
        const dLon = parseFloat(dropoff_lng || dest_lng);

        const hasSpatialSearch = !isNaN(pLat) && !isNaN(pLon) && !isNaN(dLat) && !isNaN(dLon);
        const maxDetour = parseFloat(max_detour_km) || 5.0;
        
        const query = `
            SELECT 
                r.ride_id, r.driver_id, r.veh_no, r.origin, r.destination, 
                r.departure_time, r.total_seats, r.available_seats, r.fare_per_seat, r.subsidy_per_seat, r.status,
                r.polyline,
                u.name as driver_name, u.passenger_rating, u.driving_rating,
                v.vehicle_model
            FROM rides r
            JOIN users u ON r.driver_id = u.emp_id
            JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.status IN ('scheduled', 'in_progress') 
              AND r.available_seats > 0
              AND u.org_name = $1
            ORDER BY 
              CASE WHEN r.status = 'in_progress' THEN 0 ELSE 1 END ASC,
              r.departure_time ASC
        `;

        const result = await db.query(query, [org_name]);
        let rides = result.rows;

        if (hasSpatialSearch) {
            const passengerPickup = { lat: pLat, lng: pLon };
            const passengerDropoff = { lat: dLat, lng: dLon };

            const scoredRides = [];
            for (const ride of rides) {
                const match = matchRideCorridor(
                    passengerPickup,
                    passengerDropoff,
                    ride.polyline,
                    ride.origin,
                    ride.destination,
                    maxDetour
                );

                // Check H3 resolution 8 hexagonal corridor match
                let isH3Match = false;
                if (ride.polyline) {
                    try {
                        let poly = typeof ride.polyline === 'string' ? JSON.parse(ride.polyline) : ride.polyline;
                        if (Array.isArray(poly) && poly.length > 0) {
                            const corridor = h3Engine.polylineCoordsToHexCorridor(poly, 8, 1);
                            const h3Res = h3Engine.matchCarpoolH3(passengerPickup, passengerDropoff, corridor.coreHexes, 1, 8);
                            isH3Match = h3Res.isMatch;
                        }
                    } catch (e) {}
                }

                const isAnyMatch = match.isMatch || isH3Match;

                if (isAnyMatch) {
                    scoredRides.push({
                        ...ride,
                        corridor_match: true,
                        is_h3_matched: isH3Match,
                        en_route_available: ride.status === 'in_progress',
                        pickup_distance_km: match.pickupDistanceKm,
                        dropoff_distance_km: match.dropoffDistanceKm,
                        total_detour_km: match.totalDetourKm,
                        passenger_travel_km: match.passengerTravelKm
                    });
                } else if (filter_corridor_only !== 'true') {
                    // Include with corridor_match: false if not strictly filtered
                    const oLat = parseFloat(ride.origin?.lat);
                    const oLon = parseFloat(ride.origin?.lng || ride.origin?.lon);
                    const directDist = (!isNaN(oLat) && !isNaN(oLon)) ? haversineDistance(pLat, pLon, oLat, oLon) : 999;
                    scoredRides.push({
                        ...ride,
                        corridor_match: false,
                        is_h3_matched: false,
                        en_route_available: ride.status === 'in_progress',
                        total_detour_km: parseFloat(directDist.toFixed(2))
                    });
                }
            }

            // Sort matched rides first (en-route first if active, then lowest detour distance)
            scoredRides.sort((a, b) => {
                if (a.corridor_match && !b.corridor_match) return -1;
                if (!a.corridor_match && b.corridor_match) return 1;
                if (a.en_route_available && !b.en_route_available) return -1;
                if (!a.en_route_available && b.en_route_available) return 1;
                if ((a.total_detour_km || 0) !== (b.total_detour_km || 0)) {
                    return (a.total_detour_km || 0) - (b.total_detour_km || 0);
                }
                return new Date(a.departure_time) - new Date(b.departure_time);
            });

            rides = scoredRides;
        } else {
            // No spatial search - tag en-route flag
            rides = rides.map(r => ({
                ...r,
                en_route_available: r.status === 'in_progress'
            }));
        }

        return res.json({
            success: true,
            total_rides: rides.length,
            rides: rides
        });
    } catch (err) {
        console.error("Error fetching rides:", err);
        return next(err);
    }
});

// GET /rides/driver/active
// Fetch the active ride published by the logged-in user, along with its bookings
router.get('/driver/active', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ success: false, message: "Unauthorized." });
        }

        const driver_id = req.user.emp_id;

        // Query to get the driver's active ride (scheduled or in_progress)
        const rideQuery = `
            SELECT r.*, v.vehicle_model
            FROM rides r
            JOIN vehicles v ON r.veh_no = v.veh_no
            WHERE r.driver_id = $1 AND r.status IN ('scheduled', 'in_progress')
            ORDER BY r.created_at DESC
            LIMIT 1
        `;
        const rideResult = await db.query(rideQuery, [driver_id]);

        if (rideResult.rows.length === 0) {
            return res.json({ success: true, ride: null });
        }

        const activeRide = rideResult.rows[0];

        // Query to get bookings for this ride
        const bookingsQuery = `
            SELECT b.booking_id, b.passenger_id, b.pickup_location, b.dropoff_location, 
                   b.booking_status, b.payment_status, 
                   r.fare_per_seat,
                   u.name as passenger_name, u.phone as passenger_phone
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            JOIN users u ON b.passenger_id = u.emp_id
            WHERE b.ride_id = $1
            ORDER BY b.created_at ASC
        `;
        const bookingsResult = await db.query(bookingsQuery, [activeRide.ride_id]);

        activeRide.bookings = bookingsResult.rows;

        return res.json({
            success: true,
            ride: activeRide
        });
    } catch (err) {
        console.error("Error fetching driver active ride:", err);
        return next(err);
    }
});

// POST /rides/driver/booking/accept
// Accept a pending booking request
router.post('/driver/booking/accept', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        
        // Ensure the driver owns the ride for this booking
        const verifyQuery = `
            SELECT r.ride_id FROM bookings b 
            JOIN rides r ON b.ride_id = r.ride_id 
            WHERE b.booking_id = $1 AND r.driver_id = $2 AND b.booking_status = 'pending'
        `;
        const verifyResult = await db.query(verifyQuery, [booking_id, req.user.emp_id]);
        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Invalid booking or unauthorized." });
        }

        await db.query(`UPDATE bookings SET booking_status = 'confirmed' WHERE booking_id = $1`, [booking_id]);
        
        const ride_id = verifyResult.rows[0].ride_id;
        const passenger_id = verifyResult.rows[0].passenger_id;
        const io = req.app.get("socketio");
        if (io) {
            const payload = { booking_id: Number(booking_id), booking_status: 'confirmed', ride_id };
            io.to(`ride_${ride_id}`).emit('booking_status_updated', payload);
            io.emit('booking_status_updated', payload);
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            io.emit('driver_refresh_bookings');
            
            // Emit notification to passenger
            io.emit('new_notification', {
                target_emp_id: passenger_id,
                title: "Ride Accepted",
                message: `Your ride request has been confirmed!`,
                type: "confirmed",
                timestamp: new Date().toISOString()
            });
        }

        return res.json({ success: true, message: "Booking accepted." });
    } catch (err) {
        console.error("Error accepting booking:", err);
        return next(err);
    }
});

// POST /rides/driver/booking/decline
// Decline a pending booking request and refund the seat
router.post('/driver/booking/decline', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        
        // Ensure the driver owns the ride for this booking
        const verifyQuery = `
            SELECT b.ride_id FROM bookings b 
            JOIN rides r ON b.ride_id = r.ride_id 
            WHERE b.booking_id = $1 AND r.driver_id = $2 AND b.booking_status = 'pending'
        `;
        const verifyResult = await db.query(verifyQuery, [booking_id, req.user.emp_id]);
        if (verifyResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Invalid booking or unauthorized." });
        }

        const ride_id = verifyResult.rows[0].ride_id;

        // Cancel the booking
        await db.query(`UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = $1`, [booking_id]);
        
        // Refund the seat
        await db.query(`UPDATE rides SET available_seats = available_seats + 1 WHERE ride_id = $1`, [ride_id]);

        const io = req.app.get("socketio");
        if (io) {
            const payload = { booking_id: Number(booking_id), booking_status: 'cancelled', ride_id };
            io.to(`ride_${ride_id}`).emit('booking_status_updated', payload);
            io.emit('booking_status_updated', payload);
            io.to(`ride_${ride_id}`).emit('driver_refresh_bookings');
            io.emit('driver_refresh_bookings');
        }

        return res.json({ success: true, message: "Booking declined." });
    } catch (err) {
        console.error("Error declining booking:", err);
        return next(err);
    }
});

// POST /rides/passenger/cancel
// Passenger cancels their booking before pickup
router.post('/passenger/cancel', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        const passenger_id = req.user.emp_id;

        const bookingRes = await db.query(
            `SELECT b.booking_id, b.ride_id, b.booking_status, b.payment_status, r.fare_per_seat, r.driver_id
             FROM bookings b
             JOIN rides r ON b.ride_id = r.ride_id
             WHERE b.booking_id = $1 AND b.passenger_id = $2`,
            [booking_id, passenger_id]
        );

        if (bookingRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found or unauthorized." });
        }

        const booking = bookingRes.rows[0];

        if (booking.booking_status === 'cancelled') {
            return res.status(400).json({ success: false, message: "Booking is already cancelled." });
        }

        if (booking.booking_status === 'in_progress' || booking.booking_status === 'completed') {
            return res.status(400).json({ success: false, message: "Cannot cancel a ride that is already in progress or completed." });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Mark booking cancelled
            await client.query(`UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = $1`, [booking_id]);

            // 2. Increment available seats back to the ride
            await client.query(`UPDATE rides SET available_seats = available_seats + 1 WHERE ride_id = $1`, [booking.ride_id]);

            // 3. If pre-paid, refund to passenger wallet
            if (booking.payment_status === 'paid' || booking.payment_status === 'completed' || booking.payment_status === 'paid_pending_confirmation') {
                const fare = parseFloat(booking.fare_per_seat || 0);
                if (fare > 0) {
                    await creditAmt(passenger_id, fare, client);
                }
            }

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = { booking_id: Number(booking_id), booking_status: 'cancelled', ride_id: booking.ride_id };
                io.to(`ride_${booking.ride_id}`).emit('booking_status_updated', payload);
                io.emit('booking_status_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');

                io.emit('new_notification', {
                    target_emp_id: booking.driver_id,
                    title: "Booking Cancelled",
                    message: "A passenger has cancelled their seat reservation.",
                    type: "cancelled",
                    timestamp: new Date().toISOString()
                });
            }

            return res.json({ success: true, message: "Booking cancelled successfully and seat restored." });
        } catch (txnErr) {
            await client.query('ROLLBACK');
            throw txnErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error cancelling passenger booking:", err);
        return next(err);
    }
});

// POST /rides/driver/cancel
// Driver cancels the scheduled ride
router.post('/driver/cancel', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { ride_id } = req.body;
        const driver_id = req.user.emp_id;

        const rideRes = await db.query(
            `SELECT ride_id, status FROM rides WHERE ride_id = $1 AND driver_id = $2`,
            [ride_id, driver_id]
        );

        if (rideRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Ride not found or unauthorized." });
        }

        const ride = rideRes.rows[0];
        if (ride.status === 'completed' || ride.status === 'cancelled') {
            return res.status(400).json({ success: false, message: `Cannot cancel a ride that is already ${ride.status}.` });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Mark ride as cancelled
            await client.query(`UPDATE rides SET status = 'cancelled' WHERE ride_id = $1`, [ride_id]);

            // 2. Fetch all bookings to cancel and refund if needed
            const bookingsRes = await client.query(
                `SELECT booking_id, passenger_id, payment_status, r.fare_per_seat 
                 FROM bookings b
                 JOIN rides r ON b.ride_id = r.ride_id
                 WHERE b.ride_id = $1 AND b.booking_status IN ('pending', 'confirmed', 'in_progress')`,
                [ride_id]
            );

            // Cancel bookings
            await client.query(
                `UPDATE bookings SET booking_status = 'cancelled' WHERE ride_id = $1 AND booking_status IN ('pending', 'confirmed', 'in_progress')`,
                [ride_id]
            );

            // Refund any pre-paid passengers
            for (const b of bookingsRes.rows) {
                if (b.payment_status === 'paid' || b.payment_status === 'completed' || b.payment_status === 'paid_pending_confirmation') {
                    const fare = parseFloat(b.fare_per_seat || 0);
                    if (fare > 0) {
                        await creditAmt(b.passenger_id, fare, client);
                    }
                }
            }

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = { ride_id: Number(ride_id), status: 'cancelled' };
                io.to(`ride_${ride_id}`).emit('ride_cancelled', payload);
                io.emit('ride_cancelled', payload);

                for (const b of bookingsRes.rows) {
                    io.emit('new_notification', {
                        target_emp_id: b.passenger_id,
                        title: "Ride Cancelled",
                        message: "The driver has cancelled this scheduled commute. Any deducted fares have been refunded.",
                        type: "cancelled",
                        timestamp: new Date().toISOString()
                    });
                }
            }

            return res.json({ success: true, message: "Ride cancelled successfully. All booked passengers notified." });
        } catch (txnErr) {
            await client.query('ROLLBACK');
            throw txnErr;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error cancelling ride by driver:", err);
        return next(err);
    }
});

// GET /rides/passenger/active
// Fetch the active ride the logged-in user is a passenger on
router.get('/passenger/active', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        
        const query = `
            SELECT b.booking_id, b.booking_status, b.payment_status, b.otp,
                   r.ride_id, r.origin, r.destination, r.departure_time, r.veh_no, r.polyline, r.fare_per_seat,
                   v.vehicle_model,
                   u.name as driver_name, u.phone as driver_phone
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            JOIN vehicles v ON r.veh_no = v.veh_no
            JOIN users u ON r.driver_id = u.emp_id
            WHERE b.passenger_id = $1 AND b.booking_status IN ('pending', 'confirmed', 'in_progress')
            ORDER BY b.booking_id DESC LIMIT 1
        `;
        const result = await db.query(query, [req.user.emp_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "No active trip found." });
        }
        
        const row = result.rows[0];

        return res.json({
            success: true,
            booking: {
                booking_id: row.booking_id,
                booking_status: row.booking_status,
                payment_status: row.payment_status,
                otp: row.otp
            },
            ride: {
                ride_id: row.ride_id,
                origin: row.origin,
                destination: row.destination,
                departure_time: row.departure_time,
                veh_no: row.veh_no,
                polyline: row.polyline,
                fare_per_seat: row.fare_per_seat,
                vehicle_model: row.vehicle_model,
                driver_name: row.driver_name,
                driver_phone: row.driver_phone
            }
        });
    } catch (err) {
        console.error("Error fetching active passenger ride:", err);
        return next(err);
    }
});

// POST /rides/passenger/pay
// Passenger makes payment for dropped off / completed ride
router.post('/passenger/pay', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id, payment_method, razorpay_payment_id } = req.body;
        const passenger_id = req.user.emp_id;

        if (!booking_id) {
            return res.status(400).json({ success: false, message: "booking_id is required" });
        }

        // Verify booking belongs to this passenger
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.booking_status, b.payment_status, b.ride_id, r.fare_per_seat, r.driver_id
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1 AND b.passenger_id = $2
        `, [booking_id, passenger_id]);

        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Booking not found or unauthorized." });
        }

        const booking = bookingResult.rows[0];
        const fare = parseFloat(booking.fare_per_seat || 45);

        // Process payment deduction from passenger's wallet if paying with wallet
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            if (payment_method === 'wallet' || !payment_method) {
                // Check if passenger has sufficient balance
                const walletRes = await client.query('SELECT balance FROM wallets WHERE emp_id = $1', [passenger_id]);
                const currentBalance = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) : 0;

                if (currentBalance < fare) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({
                        success: false,
                        insufficient_balance: true,
                        current_balance: currentBalance,
                        fare: fare,
                        message: `Insufficient wallet balance (₹${currentBalance.toFixed(2)}). Ride fare is ₹${fare.toFixed(2)}. Please pay via Razorpay / UPI or top up your wallet.`
                    });
                }

                // Deduct fare from passenger wallet
                await deductAmt(passenger_id, fare, client);
            }

            // Mark booking payment status as paid_pending_confirmation
            await client.query(
                `UPDATE bookings SET payment_status = 'paid_pending_confirmation' WHERE booking_id = $1`,
                [booking_id]
            );

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = {
                    booking_id: Number(booking_id),
                    booking_status: booking.booking_status,
                    payment_status: 'paid_pending_confirmation',
                    fare: fare,
                    ride_id: booking.ride_id,
                    payment_method: payment_method || 'wallet'
                };
                io.to(`ride_${booking.ride_id}`).emit('booking_payment_updated', payload);
                io.emit('booking_payment_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');
            }

            return res.json({
                success: true,
                message: `Payment of ₹${fare} completed! Awaiting driver confirmation.`,
                payment_status: 'paid_pending_confirmation',
                fare: fare
            });
        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error processing passenger payment:", err);
        return next(err);
    }
});

// POST /rides/driver/confirm-payment
// Driver confirms receipt of passenger's payment
router.post('/driver/confirm-payment', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) return res.status(401).json({ success: false, message: "Unauthorized." });
        const { booking_id } = req.body;
        const driver_id = req.user.emp_id;

        if (!booking_id) {
            return res.status(400).json({ success: false, message: "booking_id is required" });
        }

        // Verify driver owns the ride for this booking
        const bookingResult = await db.query(`
            SELECT b.booking_id, b.booking_status, b.payment_status, b.ride_id, r.fare_per_seat, r.driver_id
            FROM bookings b
            JOIN rides r ON b.ride_id = r.ride_id
            WHERE b.booking_id = $1 AND r.driver_id = $2
        `, [booking_id, driver_id]);

        if (bookingResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized or booking not found." });
        }

        const booking = bookingResult.rows[0];
        const fare = parseFloat(booking.fare_per_seat || 45);

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Credit the driver's wallet
            await creditAmt(driver_id, fare, client);

            // Mark booking payment status as completed
            await client.query(
                `UPDATE bookings SET payment_status = 'completed' WHERE booking_id = $1`,
                [booking_id]
            );

            await client.query('COMMIT');

            const io = req.app.get("socketio");
            if (io) {
                const payload = {
                    booking_id: Number(booking_id),
                    booking_status: 'completed',
                    payment_status: 'completed',
                    fare: fare,
                    ride_id: booking.ride_id
                };
                io.to(`ride_${booking.ride_id}`).emit('booking_payment_updated', payload);
                io.emit('booking_payment_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('booking_status_updated', payload);
                io.emit('booking_status_updated', payload);
                io.to(`ride_${booking.ride_id}`).emit('driver_refresh_bookings');
                io.emit('driver_refresh_bookings');
            }

            return res.json({
                success: true,
                message: `Payment of ₹${fare} confirmed and credited to your commute wallet!`,
                payment_status: 'completed',
                fare: fare
            });
        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Error confirming payment by driver:", err);
        return next(err);
    }
});

// POST /rides/fare-estimate
// Computes dynamic fair commute pricing, vehicle consumption split, and corporate green commute subsidy
router.post('/fare-estimate', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }

        const { origin, destination, seats } = req.body;
        if (!origin || !destination) {
            return res.status(400).json({ success: false, message: "origin and destination are required" });
        }

        const oLat = parseFloat(origin.lat);
        const oLon = parseFloat(origin.lng || origin.lon);
        const dLat = parseFloat(destination.lat);
        const dLon = parseFloat(destination.lng || destination.lon);

        let distanceKm = 15.0; // fallback default
        if (!isNaN(oLat) && !isNaN(oLon) && !isNaN(dLat) && !isNaN(dLon)) {
            const rawDist = haversineDistance(oLat, oLon, dLat, dLon);
            distanceKm = parseFloat((rawDist * 1.3).toFixed(1));
        }

        const orgName = req.user.org_name || 'Odoo';
        // Fetch org settings (fuel reimbursement & green commute subsidy)
        const orgRes = await db.query(
            "SELECT fuel_cost_per_km, travel_cost_per_km FROM org_settings WHERE org_name = $1",
            [orgName]
        );
        const fuelCostPerKm = parseFloat(orgRes.rows[0]?.fuel_cost_per_km || 5.50);
        const travelSubsidyPerKm = parseFloat(orgRes.rows[0]?.travel_cost_per_km || 2.00);

        // Fetch driver's vehicle fuel consumption ratio if available
        const vehRes = await db.query(
            "SELECT fuel_consumption_ratio, seating_capacity FROM vehicles WHERE emp_id = $1",
            [req.user.emp_id]
        );
        const fuelRatio = parseFloat(vehRes.rows[0]?.fuel_consumption_ratio || 1.0);
        const totalSeats = parseInt(seats) || parseInt(vehRes.rows[0]?.seating_capacity || 4);

        // Dynamic Fare Split Formula
        const totalTripFuelCost = Math.round(distanceKm * fuelCostPerKm * fuelRatio);
        const baseFarePerSeat = Math.max(15, Math.round(totalTripFuelCost / totalSeats));
        const subsidyPerSeat = Math.round(Math.min(baseFarePerSeat * 0.45, (distanceKm * travelSubsidyPerKm) / totalSeats));
        const recommendedPassengerFare = Math.max(10, baseFarePerSeat - subsidyPerSeat);
        const driverEarningsPerSeat = baseFarePerSeat; // driver receives passenger fare + company subsidy

        return res.json({
            success: true,
            distanceKm,
            fuelCostPerKm,
            travelSubsidyPerKm,
            fuelRatio,
            totalSeats,
            totalTripFuelCost,
            baseFarePerSeat,
            subsidyPerSeat,
            recommendedPassengerFare,
            driverEarningsPerSeat
        });
    } catch (err) {
        console.error("Error calculating fare estimate:", err);
        return next(err);
    }
});

module.exports = router;
