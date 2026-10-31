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

async function runTests() {
    console.log("=== STARTING PRIORITY #1 INTEGRATION TEST ===");
    const testId = Date.now().toString().slice(-6);

    // TEST 1: Passenger Signup
    console.log("\n[TEST 1] Testing Passenger Registration Flow...");
    const passengerEmail = `passenger_${testId}@odoo.com`;
    const pSignupRes = await makeRequest('/auth/signup', 'POST', {
        name: `Passenger Test ${testId}`,
        email: passengerEmail,
        phone: "+91 9876543210",
        password: "Password@123",
        role: "employee",
        organization: "Odoo",
        rider_type: "passenger"
    });

    if (pSignupRes.status !== 200 || !pSignupRes.data.requires2FA) {
        throw new Error(`Passenger signup failed: ${JSON.stringify(pSignupRes.data)}`);
    }
    console.log("✓ Passenger OTP requested successfully. Dev OTP:", pSignupRes.data.devOtp);

    const pVerifyRes = await makeRequest('/auth/verify-signup-otp', 'POST', {
        email: passengerEmail,
        otp: pSignupRes.data.devOtp
    });

    if (pVerifyRes.status !== 200 || !pVerifyRes.data.token) {
        throw new Error(`Passenger OTP verify failed: ${JSON.stringify(pVerifyRes.data)}`);
    }
    console.log("✓ Passenger verified successfully. User data:", {
        emp_id: pVerifyRes.data.user.emp_id,
        rider_type: pVerifyRes.data.user.rider_type,
        is_vehicle_registered: pVerifyRes.data.user.is_vehicle_registered
    });

    if (pVerifyRes.data.user.rider_type !== 'passenger' || pVerifyRes.data.user.is_vehicle_registered !== '0') {
        throw new Error(`Expected passenger rider_type='passenger' and is_vehicle_registered='0'`);
    }
    console.log("✓ Set-Cookie header check:", pVerifyRes.cookies.some(c => c.includes('token=')) ? "Passed (HTTP-only token cookie set)" : "Failed");

    // TEST 2: Rider / Driver Registration Flow
    console.log("\n[TEST 2] Testing Rider / Driver Two-Step Registration...");
    const riderEmail = `rider_${testId}@odoo.com`;
    const rSignupRes = await makeRequest('/auth/signup', 'POST', {
        name: `Rider Driver ${testId}`,
        email: riderEmail,
        phone: "+91 9123456789",
        password: "Password@123",
        role: "employee",
        organization: "Odoo",
        rider_type: "rider",
        dl_no: `DL-KA-${testId}`,
        vehicle_no: `KA-01-EQ-${testId}`,
        vehicle_model: "Honda City V MT",
        seating_capacity: 4,
        fuel_consumption_ratio: 0.85,
        insurance_no: `INS-${testId}`
    });

    if (rSignupRes.status !== 200 || !rSignupRes.data.requires2FA) {
        throw new Error(`Rider signup failed: ${JSON.stringify(rSignupRes.data)}`);
    }
    console.log("✓ Rider OTP requested successfully with driver credentials. Dev OTP:", rSignupRes.data.devOtp);

    const rVerifyRes = await makeRequest('/auth/verify-signup-otp', 'POST', {
        email: riderEmail,
        otp: rSignupRes.data.devOtp
    });

    if (rVerifyRes.status !== 200 || !rVerifyRes.data.token) {
        throw new Error(`Rider OTP verify failed: ${JSON.stringify(rVerifyRes.data)}`);
    }
    console.log("✓ Rider verified. Verification application recorded:", {
        verification_id: rVerifyRes.data.verification?.verification_id,
        status: rVerifyRes.data.verification?.status,
        dl_no: rVerifyRes.data.verification?.dl_no,
        vehicle_no: rVerifyRes.data.verification?.vehicle_no
    });

    if (rVerifyRes.data.user.rider_type !== 'rider' || rVerifyRes.data.user.is_vehicle_registered !== '1') {
        throw new Error(`Expected rider_type='rider' and is_vehicle_registered='1' (pending verification queue)`);
    }
    if (!rVerifyRes.data.verification || rVerifyRes.data.verification.status !== 'pending') {
        throw new Error(`Expected pending verification record in rider_verifications table!`);
    }

    const riderToken = rVerifyRes.data.token;
    const verificationId = rVerifyRes.data.verification.verification_id;

    // Check Rider Status endpoint
    console.log("\n[TEST 3] Testing GET /auth/rider-status for Pending Driver...");
    const rStatusRes = await makeRequest('/auth/rider-status', 'GET', null, {
        Authorization: `Bearer ${riderToken}`
    });
    console.log("✓ Status endpoint response:", {
        rider_type: rStatusRes.data.rider_type,
        is_vehicle_registered: rStatusRes.data.is_vehicle_registered,
        verification_status: rStatusRes.data.verification?.status
    });

    // Check that Pending Rider CANNOT Publish Ride
    console.log("\n[TEST 4] Verifying Pending Driver CANNOT publish ride...");
    const now = new Date();
    const departure = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const pubRes = await makeRequest('/publish-ride', 'POST', {
        origin: { lat: 22.5726, lng: 88.3639, name: "Kolkata" },
        destination: { lat: 22.7667, lng: 88.3667, name: "Barrackpore" },
        departure_time: departure,
        fare_per_seat: 45
    }, {
        Authorization: `Bearer ${riderToken}`
    });

    if (pubRes.status === 400 && pubRes.data.message.includes("pending")) {
        console.log(`✓ Ride publishing correctly blocked with 400: "${pubRes.data.message}"`);
    } else {
        throw new Error(`Expected ride publish to be blocked with 400 pending error, got: ${pubRes.status} ${JSON.stringify(pubRes.data)}`);
    }

    // TEST 5: Admin reviews queue and approves rider
    console.log("\n[TEST 5] Testing Admin Review & Approval Queue...");
    const adminEmail = `admin_${testId}@odoo.com`;
    const aSignupRes = await makeRequest('/auth/signup', 'POST', {
        name: `Admin Officer ${testId}`,
        email: adminEmail,
        phone: "+91 9999900000",
        password: "Password@123",
        role: "admin",
        organization: "Odoo",
        rider_type: "passenger"
    });
    const aVerifyRes = await makeRequest('/auth/verify-signup-otp', 'POST', {
        email: adminEmail,
        otp: aSignupRes.data.devOtp
    });
    const adminToken = aVerifyRes.data.token;

    // Admin fetches pending verifications
    const verifListRes = await makeRequest('/admin/rider-verifications', 'GET', null, {
        Authorization: `Bearer ${adminToken}`
    });
    const foundApp = verifListRes.data.verifications?.find(v => v.verification_id === verificationId);
    if (!foundApp) {
        throw new Error(`Verification application ${verificationId} not found in admin queue list`);
    }
    console.log(`✓ Found driver application in Admin queue: Driver=${foundApp.name}, Vehicle=${foundApp.vehicle_model}, Plate=${foundApp.vehicle_no}, Status=${foundApp.status}`);

    // Admin approves the application
    console.log("\n[TEST 6] Admin Approves Driver Application...");
    const approveRes = await makeRequest('/admin/rider-verifications/approve', 'POST', {
        verification_id: verificationId
    }, {
        Authorization: `Bearer ${adminToken}`
    });

    if (approveRes.status !== 200 || !approveRes.data.success) {
        throw new Error(`Admin approval failed: ${JSON.stringify(approveRes.data)}`);
    }
    console.log("✓ Admin approval response:", approveRes.data.message);

    // Verify driver status is now approved (2)
    const rStatusAfterApprove = await makeRequest('/auth/rider-status', 'GET', null, {
        Authorization: `Bearer ${riderToken}`
    });
    console.log("✓ Driver status after admin approval:", {
        is_vehicle_registered: rStatusAfterApprove.data.is_vehicle_registered,
        verification_status: rStatusAfterApprove.data.verification?.status
    });

    if (rStatusAfterApprove.data.is_vehicle_registered !== '2') {
        throw new Error(`Expected is_vehicle_registered to be '2' (approved), got: ${rStatusAfterApprove.data.is_vehicle_registered}`);
    }

    // TEST 7: Approved Driver Publishes Ride
    console.log("\n[TEST 7] Testing Approved Driver Publishing Ride...");
    const pubSuccessRes = await makeRequest('/publish-ride', 'POST', {
        origin: { lat: 22.5726, lng: 88.3639, name: "Kolkata" },
        destination: { lat: 22.7667, lng: 88.3667, name: "Barrackpore" },
        departure_time: departure,
        fare_per_seat: 45
    }, {
        Authorization: `Bearer ${riderToken}`
    });

    if (pubSuccessRes.status !== 200 || !pubSuccessRes.data.success) {
        throw new Error(`Approved rider publishing failed: ${JSON.stringify(pubSuccessRes.data)}`);
    }
    console.log("✓ Ride successfully published by approved driver! Ride ID:", pubSuccessRes.data.ride_id);

    // TEST 8: Logout endpoint
    console.log("\n[TEST 8] Testing Logout endpoint...");
    const logoutRes = await makeRequest('/auth/logout', 'POST', null, {
        Authorization: `Bearer ${riderToken}`
    });
    console.log("✓ Logout response:", logoutRes.data.message);

    console.log("\n🎉 ALL PRIORITY #1 TESTS PASSED PERFECTLY!");
    process.exit(0);
}

runTests().catch(err => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});

