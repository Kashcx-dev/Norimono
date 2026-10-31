const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../handlers/dbHandler");
const { FN_verifyTkn } = require("../handlers/middlewareHandler");

/* HASHING FUNCTIONS */
async function Hash_Pass(password) {
    const saltRounds = parseInt(process.env.CRYPT_SALT || "10");
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 10 : saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

async function Compare_Pass(password, hash) {
    return await bcrypt.compare(password, hash);
}

const router = express.Router();

// 2FA Setup
const otpStore = new Map();
const signupStore = new Map();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOtp(email, otp, subject, text) {
    const isDevMode = process.env.DEV_MODE === 'true' || !process.env.EMAIL_USER || !process.env.EMAIL_PASS;
    console.log(`\n======================================================`);
    console.log(`🔑 [Norimono 2FA OTP] To: ${email}`);
    console.log(`👉 Verification Code: ${otp} (Valid for 5 minutes)`);
    console.log(`======================================================\n`);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await transporter.sendMail({
                from: `"Norimono" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: subject,
                text: text
            });
            return { sentByEmail: true };
        } catch (emailErr) {
            console.warn(`[Warning] Could not send email OTP: ${emailErr.message}. Fallback to console OTP.`);
            return { sentByEmail: false, fallback: true };
        }
    }
    return { sentByEmail: false, isDevMode: true };
}

function detectOrganization(email, explicitOrg) {
    if (explicitOrg && explicitOrg.trim()) return explicitOrg.trim();
    if (email && email.includes('@')) {
        const domain = email.split('@')[1].toLowerCase();
        if (domain.includes('odoo')) return 'Odoo';
        if (domain.includes('google')) return 'Google';
        if (domain.includes('microsoft')) return 'Microsoft';
        if (domain.includes('meta')) return 'Meta';
        const domainName = domain.split('.')[0];
        return domainName.charAt(0).toUpperCase() + domainName.slice(1);
    }
    return 'Odoo';
}

// --- SIGNUP FLOW ---
router.post("/signup", async (req, res, next) => {
    const { 
        name, 
        email, 
        phone, 
        password, 
        role, 
        organization,
        rider_type,
        dl_no,
        vehicle_no,
        vehicle_model,
        seating_capacity,
        fuel_consumption_ratio,
        insurance_no
    } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const resolvedOrg = detectOrganization(email, organization);
    const selectedRole = (role === 'admin') ? 'admin' : 'employee';
    const selectedRiderType = (rider_type === 'rider') ? 'rider' : 'passenger';

    // Validation for rider / driver role
    if (selectedRiderType === 'rider') {
        if (!dl_no || !vehicle_no || !vehicle_model) {
            return res.status(400).json({ 
                message: "Driver credentials (DL number, vehicle number, and vehicle model) are required for riders." 
            });
        }
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows[0]) {
            return res.status(400).json({ message: "Email already registered." });
        }

        const hashedPassword = await Hash_Pass(password);
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        signupStore.set(email, { 
            name, 
            phone, 
            role: selectedRole,
            rider_type: selectedRiderType,
            hashedPassword, 
            org_name: resolvedOrg,
            code: otp, 
            expiresAt,
            driver_credentials: selectedRiderType === 'rider' ? {
                dl_no: dl_no.trim(),
                vehicle_no: vehicle_no.trim().toUpperCase(),
                vehicle_model: vehicle_model.trim(),
                seating_capacity: parseInt(seating_capacity, 10) || 4,
                fuel_consumption_ratio: parseFloat(fuel_consumption_ratio) || 1.0,
                insurance_no: insurance_no ? insurance_no.trim() : null
            } : null
        });

        const otpResult = await sendOtp(
            email, 
            otp, 
            "Verify Your Norimono Account", 
            `Your verification OTP is: ${otp}. Valid for 5 minutes.`
        );

        return res.json({ 
            success: true, 
            message: `Verification OTP sent to ${email}.`,
            requires2FA: true,
            rider_type: selectedRiderType,
            organization: resolvedOrg,
            devOtp: process.env.DEV_MODE === 'true' ? otp : undefined
        });
    } catch (err) {
        return next(err);
    }
});

router.post("/verify-signup-otp", async (req, res, next) => {
    const { email, otp } = req.body;
    const record = signupStore.get(email);

    if (!record) {
        return res.status(400).json({ message: "No signup verification session found. Please register again." });
    }

    if (Date.now() > record.expiresAt) {
        signupStore.delete(email);
        return res.status(400).json({ message: "Verification session expired. Please register again." });
    }

    if (record.code === otp) {
        try {
            const emp_id = "EMP-" + crypto.randomBytes(3).toString("hex").toUpperCase();
            const userRole = record.role || 'employee';
            const riderType = record.rider_type || 'passenger';
            const isVehicleRegistered = riderType === 'rider' ? '1' : '0'; // 1 = pending verification, 0 = passenger
            
            await db.query(
                `INSERT INTO users (emp_id, name, email, org_name, phone, role, rider_type, is_vehicle_registered, password_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, 
                [emp_id, record.name, email, record.org_name, record.phone || null, userRole, riderType, isVehicleRegistered, record.hashedPassword]
            );

            // Also ensure org_settings exists for this new org_name
            await db.query(
                `INSERT INTO org_settings (org_name, fuel_cost_per_km, travel_cost_per_km) 
                 VALUES ($1, 5.50, 2.00) 
                 ON CONFLICT (org_name) DO NOTHING`,
                [record.org_name]
            );

            // If rider, create pending entry in rider_verifications
            let verificationRecord = null;
            if (riderType === 'rider' && record.driver_credentials) {
                const cred = record.driver_credentials;
                const vRes = await db.query(
                    `INSERT INTO rider_verifications 
                     (emp_id, dl_no, vehicle_no, vehicle_model, seating_capacity, fuel_consumption_ratio, insurance_no, status) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                     RETURNING *`,
                    [emp_id, cred.dl_no, cred.vehicle_no, cred.vehicle_model, cred.seating_capacity, cred.fuel_consumption_ratio, cred.insurance_no]
                );
                verificationRecord = vRes.rows[0];

                const io = req.app.get("socketio");
                if (io) {
                    io.emit("new_rider_application", {
                        verification_id: verificationRecord.verification_id,
                        emp_id,
                        name: record.name,
                        email,
                        vehicle_model: cred.vehicle_model,
                        vehicle_no: cred.vehicle_no
                    });
                }
            }

            signupStore.delete(email);

            const user_data = { 
                emp_id, 
                email, 
                name: record.name, 
                role: userRole, 
                org_name: record.org_name,
                rider_type: riderType,
                is_vehicle_registered: isVehicleRegistered
            };
            const token = jwt.sign(user_data, process.env.JWT_SECRET || 'secret', { expiresIn: "7d" });

            // Set HTTP-only secure cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.json({ 
                success: true, 
                message: riderType === 'rider' 
                    ? "Rider registered successfully! Your driver verification is pending administrator review."
                    : "Passenger registered successfully!", 
                token: token,
                user: user_data,
                verification: verificationRecord
            });
        } catch (err) {
            return next(err);
        }
    }

    return res.status(400).json({ message: "Invalid verification code. Please try again." });
});


// --- LOGIN FLOW ---
router.post("/login", async (req, res, next) => {
    const { email, password, organization } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1 OR emp_id = $1', [email]);
        const user = result.rows[0];

        if (user) {
            if (user.org_name && user.org_name !== organization) {
                return res.status(401).json({ message: "This email does not belong to the selected organization." });
            }
            const isMatch = await Compare_Pass(password, user.password_hash);
            if (isMatch) {
                const otp = crypto.randomInt(100000, 999999).toString();
                const expiresAt = Date.now() + 5 * 60 * 1000;

                otpStore.set(user.email, { 
                    code: otp, 
                    expiresAt, 
                    emp_id: user.emp_id,
                    name: user.name,
                    role: user.role,
                    org_name: user.org_name,
                    rider_type: user.rider_type || 'passenger',
                    is_vehicle_registered: user.is_vehicle_registered || '0'
                });

                const otpResult = await sendOtp(
                    user.email,
                    otp,
                    "Your Login OTP for Norimono",
                    `Your OTP for login is: ${otp}. Valid for 5 minutes.`
                );
                
                return res.json({ 
                    success: true, 
                    message: `OTP sent successfully to ${user.email}.`,
                    requires2FA: true,
                    resolvedEmail: user.email,
                    devOtp: process.env.DEV_MODE === 'true' ? otp : undefined
                });
            } else {
                return res.status(401).json({ message: "Incorrect password" });
            }
        } else {
            return res.status(400).json({ message: "Account not found. Please sign up first." });
        }
    } catch (err) {
        return next(err);
    }
});

router.post("/verify-otp", (req, res, next) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) {
        return res.status(400).json({ message: "No OTP requested or session expired. Please log in again." });
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ message: "OTP has expired. Please log in again." });
    }

    if (record.code === otp) {
        otpStore.delete(email); 
        
        const user_data = { 
            emp_id: record.emp_id, 
            email, 
            name: record.name, 
            role: record.role, 
            org_name: record.org_name,
            rider_type: record.rider_type || 'passenger',
            is_vehicle_registered: record.is_vehicle_registered || '0'
        };
        const token = jwt.sign(user_data, process.env.JWT_SECRET || 'secret', { expiresIn: "7d" });

        // Set HTTP-only secure cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        return res.json({ 
            success: true, 
            message: "Successfully Logged In!", 
            token: token,
            user: user_data
        });
    }

    return res.status(400).json({ message: "Invalid OTP. Please try again." });
});

router.post("/logout", (req, res) => {
    res.clearCookie("token");
    return res.json({ success: true, message: "Logged out successfully" });
});

router.get("/me", FN_verifyTkn, async (req, res, next) => {
    try {
        const emp_id = req.user.emp_id;
        const userQuery = await db.query(
            "SELECT emp_id, name, email, org_name, phone, role, rider_type, is_vehicle_registered, address, passenger_rating, driving_rating FROM users WHERE emp_id = $1",
            [emp_id]
        );
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const profile = userQuery.rows[0];
        
        // Fetch vehicle if any
        const vehicleQuery = await db.query(
            "SELECT * FROM vehicles WHERE emp_id = $1",
            [emp_id]
        );
        profile.vehicle = vehicleQuery.rows.length > 0 ? vehicleQuery.rows[0] : null;

        // Fetch latest verification application if any
        const verifQuery = await db.query(
            "SELECT * FROM rider_verifications WHERE emp_id = $1 ORDER BY created_at DESC LIMIT 1",
            [emp_id]
        );
        profile.verification = verifQuery.rows.length > 0 ? verifQuery.rows[0] : null;
        
        return res.json({ success: true, profile });
    } catch (err) {
        return next(err);
    }
});

router.get("/rider-status", FN_verifyTkn, async (req, res, next) => {
    try {
        const emp_id = req.user.emp_id;
        const uRes = await db.query(
            "SELECT rider_type, is_vehicle_registered FROM users WHERE emp_id = $1", 
            [emp_id]
        );
        const vRes = await db.query(
            "SELECT * FROM rider_verifications WHERE emp_id = $1 ORDER BY created_at DESC LIMIT 1", 
            [emp_id]
        );

        return res.json({
            success: true,
            rider_type: uRes.rows[0]?.rider_type || 'passenger',
            is_vehicle_registered: uRes.rows[0]?.is_vehicle_registered || '0',
            verification: vRes.rows[0] || null
        });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;