const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqHeaders = {
            'Content-Type': 'application/json',
            ...headers
        };
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let json = {};
                try {
                    json = JSON.parse(data);
                } catch (e) {
                    json = { raw: data };
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    cookies: res.headers['set-cookie'] || [],
                    data: json
                });
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function registerAndVerify(name, email, role, riderType, driverCreds = null) {
    const signupRes = await makeRequest('/auth/signup', 'POST', {
        name,
        email,
        phone: "+91 9876500000",
        password: "Password@123",
        role,
        organization: "Odoo",
        rider_type: riderType,
        ...(driverCreds || {})
    });
    if (signupRes.status !== 200) {
        throw new Error(`Signup failed for ${email}: ${JSON.stringify(signupRes.data)}`);
    }

    const verifyRes = await makeRequest('/auth/verify-signup-otp', 'POST', {
        email,
        otp: signupRes.data.devOtp
    });
    if (verifyRes.status !== 200 || !verifyRes.data.token) {
        throw new Error(`OTP verify failed for ${email}: ${JSON.stringify(verifyRes.data)}`);
    }

    return {
        token: verifyRes.data.token,
        user: verifyRes.data.user,
        verification: verifyRes.data.verification
    };
}

async function runTests() {
    console.log("=== STARTING PRIORITY #2 & #3 INTEGRATION SUITE ===");
    const testId = Date.now().toString().slice(-6);

    // 1. Setup Admin, Driver, and En-Route Passenger
    console.log("\n[SETUP] Creating Admin, Driver, and Passenger accounts...");
    const admin = await registerAndVerify(`Admin ${testId}`, `admin_${testId}@odoo.com`, 'admin', 'passenger');
    const driver = await registerAndVerify(
        `Driver ${testId}`, 
        `driver_${testId}@odoo.com`, 
        'employee', 
        'rider', 
        {
            dl_no: `DL-MH-${testId}`,
            vehicle_no: `MH-12-CD-${testId}`,
            vehicle_model: "Maruti Suzuki Swift",
            seating_capacity: 4,
            fuel_consumption_ratio: 0.90,
            insurance_no: `POL-${testId}`
        }
    );
    const passenger = await registerAndVerify(`Passenger ${testId}`, `pass_${testId}@odoo.com`, 'employee', 'passenger');

    // Admin approves driver
    console.log("✓ Admin approving driver credentials...");
    const approveRes = await makeRequest('/admin/rider-verifications/approve', 'POST', {
        verification_id: driver.verification.verification_id
    }, {
        Authorization: `Bearer ${admin.token}`
    });
    if (approveRes.status !== 200) {
        throw new Error(`Driver approval failed: ${JSON.stringify(approveRes.data)}`);
    }
    console.log("✓ Driver approved and vehicle added to fleet.");

    // 2. TEST PRIORITY #2: Dynamic Corporate Fare & Subsidy Calculation
    console.log("\n[TEST 1 - PRIORITY #2] Testing /rides/fare-estimate (Org Fare Policy & Green Subsidy)...");
    const origin = { lat: 22.5726, lng: 88.3639, name: "Kolkata Central" };
    const destination = { lat: 22.7667, lng: 88.3667, name: "Barrackpore Industrial Hub" };

    const estRes = await makeRequest('/rides/fare-estimate', 'POST', {
        origin,
        destination,
        seats: 4
    }, {
        Authorization: `Bearer ${driver.token}`
    });

    if (estRes.status !== 200 || !estRes.data.success) {
        throw new Error(`Fare estimation failed: ${JSON.stringify(estRes.data)}`);
    }
    console.log("✓ Dynamic Fare Breakdown:", {
        distanceKm: estRes.data.distanceKm,
        fuelCostPerKm: estRes.data.fuelCostPerKm,
        totalTripFuelCost: estRes.data.totalTripFuelCost,
        baseFarePerSeat: estRes.data.baseFarePerSeat,
        subsidyPerSeat: estRes.data.subsidyPerSeat,
        recommendedPassengerFare: estRes.data.recommendedPassengerFare,
        driverEarningsPerSeat: estRes.data.driverEarningsPerSeat
    });

    if (estRes.data.subsidyPerSeat <= 0 || estRes.data.recommendedPassengerFare <= 0) {
        throw new Error("Expected non-zero subsidy and passenger fare");
    }

    // 3. Driver Publishes Ride with Subsidy
    console.log("\n[TEST 2 - PRIORITY #2] Driver Publishing Ride with Corporate Subsidy...");
    const now = new Date();
    const departure = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const pubRes = await makeRequest('/publish-ride', 'POST', {
        origin,
        destination,
        departure_time: departure,
        fare_per_seat: estRes.data.recommendedPassengerFare,
        subsidy_per_seat: estRes.data.subsidyPerSeat
    }, {
        Authorization: `Bearer ${driver.token}`
    });

    if (pubRes.status !== 200 || !pubRes.data.success) {
        throw new Error(`Publish ride failed: ${JSON.stringify(pubRes.data)}`);
    }
    const rideId = pubRes.data.ride_id;
    console.log(`✓ Ride #${rideId} published with fare=₹${estRes.data.recommendedPassengerFare}/seat, subsidy=₹${pubRes.data.subsidy_per_seat}/seat`);

    // 4. TEST PRIORITY #3: Transition Ride to In-Progress (Driver is on the road)
    console.log("\n[TEST 3 - PRIORITY #3] Starting Ride (Driver En-Route Status)...");
    const db = require('../handlers/dbHandler');
    await db.query("UPDATE rides SET status = 'in_progress' WHERE ride_id = $1", [rideId]);

    // 5. TEST PRIORITY #3: H3 Corridor Search & En-Route Availability Check
    console.log("\n[TEST 4 - PRIORITY #3] Passenger Searching Rides Along H3 Corridor...");
    // A point along Kolkata - Barrackpore corridor (e.g. Sodepur ~ 22.697, 88.391)
    const browseRes = await makeRequest(`/rides?pickup_lat=22.697&pickup_lng=88.391&dropoff_lat=22.7667&dropoff_lng=88.3667`, 'GET', null, {
        Authorization: `Bearer ${passenger.token}`
    });

    if (browseRes.status !== 200 || !browseRes.data.rides) {
        throw new Error(`Browse rides failed: ${JSON.stringify(browseRes.data)}`);
    }

    const matchedRide = browseRes.data.rides.find(r => r.ride_id === rideId);
    if (!matchedRide) {
        throw new Error(`Ride #${rideId} not found in corridor search`);
    }
    console.log("✓ En-Route Ride Matched via Corridor:", {
        ride_id: matchedRide.ride_id,
        driver_name: matchedRide.driver_name,
        status: matchedRide.status,
        en_route_available: matchedRide.en_route_available,
        corridor_match: matchedRide.corridor_match,
        fare_per_seat: matchedRide.fare_per_seat,
        subsidy_per_seat: matchedRide.subsidy_per_seat
    });

    if (!matchedRide.en_route_available) {
        throw new Error("Expected ride to have en_route_available: true");
    }

    // 6. TEST PRIORITY #3: Mid-Route Passenger Booking (While Driver is En-Route)
    console.log("\n[TEST 5 - PRIORITY #3] En-Route Passenger Booking Seat on Active Ride...");
    const bookRes = await makeRequest('/book-ride', 'POST', {
        ride_id: rideId,
        pickup_location: { lat: 22.697, lng: 88.391, name: "Sodepur Station Waypoint" },
        dropoff_location: destination,
        seats_count: 1
    }, {
        Authorization: `Bearer ${passenger.token}`
    });

    if (bookRes.status !== 200 || !bookRes.data.success) {
        throw new Error(`En-route booking failed: ${JSON.stringify(bookRes.data)}`);
    }
    const bookingId = bookRes.data.booking_id;
    const pickupOtp = bookRes.data.pickup_otp;
    console.log(`✓ En-route booking #${bookingId} confirmed! Passenger 4-Digit Boarding OTP: ${pickupOtp}`);

    // Verify booking in database has is_en_route = true
    const bCheck = await db.query("SELECT is_en_route, fare_amount, otp FROM bookings WHERE booking_id = $1", [bookingId]);
    if (!bCheck.rows[0].is_en_route) {
        throw new Error("Expected booking.is_en_route to be true");
    }
    console.log("✓ Database record verified: is_en_route = true, fare_amount =", bCheck.rows[0].fare_amount);

    // 7. TEST PRIORITY #3: Driver Verifies Pickup at Waypoint with 4-Digit OTP
    console.log("\n[TEST 6 - PRIORITY #3] Driver Verifying Waypoint Pickup via OTP (/pickup-ride)...");
    const pickupRes = await makeRequest('/pickup-ride', 'POST', {
        booking_id: bookingId,
        otp: pickupOtp
    }, {
        Authorization: `Bearer ${driver.token}`
    });

    if (pickupRes.status !== 200 || !pickupRes.data.success) {
        throw new Error(`Pickup verification failed: ${JSON.stringify(pickupRes.data)}`);
    }
    console.log("✓ Driver pickup verified:", pickupRes.data.message);

    // 8. TEST PRIORITY #2: Ride Completion & Atomic Wallet Settlement with Subsidy
    console.log("\n[TEST 7 - PRIORITY #2] Finishing Ride & Settling Corporate Commute Subsidies (/finish-ride)...");
    
    // Check balances before
    const pWalletBefore = await makeRequest('/wallet', 'GET', null, { Authorization: `Bearer ${passenger.token}` });
    const dWalletBefore = await makeRequest('/wallet', 'GET', null, { Authorization: `Bearer ${driver.token}` });

    const finishRes = await makeRequest('/finish-ride', 'POST', {
        ride_id: rideId
    }, {
        Authorization: `Bearer ${driver.token}`
    });

    if (finishRes.status !== 200 || !finishRes.data.success) {
        throw new Error(`Finish ride failed: ${JSON.stringify(finishRes.data)}`);
    }
    console.log("✓ Ride finish settlement response:", finishRes.data);

    // Check balances after
    const pWalletAfter = await makeRequest('/wallet', 'GET', null, { Authorization: `Bearer ${passenger.token}` });
    const dWalletAfter = await makeRequest('/wallet', 'GET', null, { Authorization: `Bearer ${driver.token}` });

    const pDeduction = pWalletBefore.data.wallet.balance - pWalletAfter.data.wallet.balance;
    const dEarnings = dWalletAfter.data.wallet.balance - dWalletBefore.data.wallet.balance;

    console.log(`✓ Passenger Wallet: Deducted ₹${pDeduction.toFixed(2)} (Subsidized Net Fare)`);
    console.log(`✓ Driver Wallet: Credited ₹${dEarnings.toFixed(2)} (Passenger Fare + Company Green Subsidy)`);

    if (Math.abs(pDeduction - estRes.data.recommendedPassengerFare) > 0.01) {
        throw new Error(`Passenger deduction mismatch: expected ${estRes.data.recommendedPassengerFare}, got ${pDeduction}`);
    }

    // 9. TEST PRIORITY #2: Verify Wallet Transactions Ledger (/wallet/transactions)
    console.log("\n[TEST 8 - PRIORITY #2] Checking Corporate Wallet Ledger History (/wallet/transactions)...");
    const pTxnRes = await makeRequest('/wallet/transactions', 'GET', null, { Authorization: `Bearer ${passenger.token}` });
    const dTxnRes = await makeRequest('/wallet/transactions', 'GET', null, { Authorization: `Bearer ${driver.token}` });

    console.log("✓ Passenger Recent Ledger Entries:", pTxnRes.data.transactions?.map(t => `${t.type}: ₹${t.amount} - ${t.description}`));
    console.log("✓ Driver Recent Ledger Entries:", dTxnRes.data.transactions?.map(t => `${t.type}: ₹${t.amount} - ${t.description}`));

    const hasSubsidyEntry = dTxnRes.data.transactions?.some(t => t.type === 'company_subsidy');
    if (!hasSubsidyEntry) {
        throw new Error("Expected company_subsidy transaction entry in driver wallet ledger!");
    }
    console.log("✓ Verified 'company_subsidy' ledger entry in driver commute wallet!");

    console.log("\n🎉 ALL PRIORITY #2 & #3 TESTS PASSED PERFECTLY!");
    process.exit(0);
}

runTests().catch(err => {
    console.error("\n❌ TEST SUITE FAILED:", err);
    process.exit(1);
});

