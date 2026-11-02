const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../handlers/dbHandler");
const { FN_verifyTkn, sendError } = require("../handlers/middlewareHandler");
const { 
    validatePhone, 
    validateName, 
    validateVehicleNo, 
    validateDlNo, 
    validateCorporateEmail, 
    validateSeats, 
    validateFuelRatio 
} = require("../utils/validator");

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

const CORPORATE_DOMAINS = {
    'tcs.com': 'TCS',
    'infosys.com': 'Infosys',
    'wipro.com': 'Wipro',
    'google.com': 'Google',
    'microsoft.com': 'Microsoft',
    'accenture.com': 'Accenture',
    'cognizant.com': 'Cognizant',
    'amazon.com': 'Amazon',
    'flipkart.com': 'Flipkart',
    'odoo.com': 'Odoo',
    'meta.com': 'Meta',
    'techmahindra.com': 'Tech Mahindra',
    'hcl.com': 'HCL Technologies',
    'ibm.com': 'IBM',
    'capgemini.com': 'Capgemini'
};

function detectOrganization(email, explicitOrg) {
    if (explicitOrg && explicitOrg.trim()) return explicitOrg.trim();
    if (email && email.includes('@')) {
        const domain = email.split('@')[1].toLowerCase();
        for (const [key, org] of Object.entries(CORPORATE_DOMAINS)) {
            if (domain === key || domain.endsWith('.' + key)) {
                return org;
            }
        }
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
        gender,
        designation,
        department,
        dl_no,
        vehicle_no,
        vehicle_model,
        seating_capacity,
        fuel_consumption_ratio,
        insurance_no
    } = req.body;

    // Strict Type and Format Validation
    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
        return sendError(res, 400, "INVALID_NAME", nameCheck.message, { field: "name" });
    }

    const emailCheck = validateCorporateEmail(email);
    if (!emailCheck.valid) {
        return sendError(res, 400, "INVALID_CORPORATE_EMAIL", emailCheck.message, { field: "email" });
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) {
        return sendError(res, 400, "INVALID_PHONE_NUMBER", phoneCheck.message, { field: "phone" });
    }

    if (!password || password.length < 6) {
        return sendError(res, 400, "WEAK_PASSWORD", "Password must be at least 6 characters.", { field: "password" });
    }

    const resolvedOrg = detectOrganization(emailCheck.value, organization);
    const selectedRole = (role === 'admin') ? 'admin' : 'employee';
    const selectedRiderType = (rider_type === 'rider') ? 'rider' : 'passenger';
    const selectedGender = (gender && ['female', 'male', 'other'].includes(gender.toLowerCase())) ? gender.toLowerCase() : 'unspecified';

    let validatedDl = null;
    let validatedVehNo = null;
    let validatedSeats = 4;
    let validatedFuel = 1.0;

    // Validation for rider / driver role
    if (selectedRiderType === 'rider') {
        const dlCheck = validateDlNo(dl_no);
        if (!dlCheck.valid) {
            return sendError(res, 400, "INVALID_DL_NUMBER", dlCheck.message, { field: "dl_no" });
        }
        validatedDl = dlCheck.value;

        const vehCheck = validateVehicleNo(vehicle_no);
        if (!vehCheck.valid) {
            return sendError(res, 400, "INVALID_VEHICLE_NUMBER", vehCheck.message, { field: "vehicle_no" });
        }
        validatedVehNo = vehCheck.value;

        if (!vehicle_model || typeof vehicle_model !== 'string' || !vehicle_model.trim()) {
            return sendError(res, 400, "MISSING_VEHICLE_MODEL", "Please provide a valid vehicle make and model.", { field: "vehicle_model" });
        }

        const seatsCheck = validateSeats(seating_capacity || 4);
        if (!seatsCheck.valid) {
            return sendError(res, 400, "INVALID_SEAT_COUNT", seatsCheck.message, { field: "seating_capacity" });
        }
        validatedSeats = seatsCheck.value;

        const fuelCheck = validateFuelRatio(fuel_consumption_ratio || 1.0);
        if (!fuelCheck.valid) {
            return sendError(res, 400, "INVALID_FUEL_RATIO", fuelCheck.message, { field: "fuel_consumption_ratio" });
        }
        validatedFuel = fuelCheck.value;
    }

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [emailCheck.value]);
        if (result.rows[0]) {
            return sendError(res, 409, "EMAIL_ALREADY_REGISTERED", "This corporate email is already registered. Please log in instead.");
        }

        const phoneExists = await db.query('SELECT emp_id FROM users WHERE phone = $1', [phoneCheck.value]);
        if (phoneExists.rows[0]) {
            return sendError(res, 409, "PHONE_ALREADY_REGISTERED", "This mobile phone number is already associated with another corporate account.");
        }

        const hashedPassword = await Hash_Pass(password);
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        signupStore.set(emailCheck.value, { 
            name: nameCheck.value, 
            phone: phoneCheck.value, 
            role: selectedRole,
            rider_type: selectedRiderType,
            gender: selectedGender,
            designation: designation || 'Software Engineer',
            department: department || 'Engineering',
            hashedPassword, 
            org_name: resolvedOrg,
            code: otp, 
            expiresAt,
            driver_credentials: selectedRiderType === 'rider' ? {
                dl_no: validatedDl,
                vehicle_no: validatedVehNo,
                vehicle_model: vehicle_model.trim(),
                seating_capacity: validatedSeats,
                fuel_consumption_ratio: validatedFuel,
                insurance_no: insurance_no ? insurance_no.trim().toUpperCase() : null
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
                `INSERT INTO users (
                    emp_id, name, email, org_name, phone, role, rider_type, 
                    is_vehicle_registered, password_hash, gender, designation, department,
                    trust_score, total_rides_completed, co2_saved_kg
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`, 
                [
                    emp_id, record.name, email, record.org_name, record.phone || null, 
                    userRole, riderType, isVehicleRegistered, record.hashedPassword,
                    record.gender || 'unspecified', record.designation || 'Software Engineer', record.department || 'Engineering',
                    99.4, 12, 28.5
                ]
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
                is_vehicle_registered: isVehicleRegistered,
                gender: record.gender || 'unspecified',
                designation: record.designation || 'Software Engineer',
                department: record.department || 'Engineering',
                trust_score: 99.4,
                total_rides_completed: 12,
                co2_saved_kg: 28.5
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
            // Relaxed organization check: allow login if email matches user account, auto-aligning to user's registered organization
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
                    is_vehicle_registered: user.is_vehicle_registered || '0',
                    gender: user.gender || 'unspecified',
                    designation: user.designation || 'Software Engineer',
                    department: user.department || 'Engineering',
                    trust_score: parseFloat(user.trust_score || 99.4),
                    total_rides_completed: parseInt(user.total_rides_completed || 15),
                    co2_saved_kg: parseFloat(user.co2_saved_kg || 34.0)
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
            is_vehicle_registered: record.is_vehicle_registered || '0',
            gender: record.gender || 'unspecified',
            designation: record.designation || 'Software Engineer',
            department: record.department || 'Engineering',
            trust_score: record.trust_score || 99.4,
            total_rides_completed: record.total_rides_completed || 15,
            co2_saved_kg: record.co2_saved_kg || 34.0
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

// Toggle between Offering a Ride (rider) and Finding a Ride (passenger)
router.post("/toggle-rider-mode", FN_verifyTkn, async (req, res, next) => {
    try {
        const emp_id = req.user.emp_id;
        const { target_mode } = req.body; // 'rider' | 'passenger'

        if (!['rider', 'passenger'].includes(target_mode)) {
            return res.status(400).json({ success: false, message: "Invalid target mode. Must be 'rider' or 'passenger'." });
        }

        const userQuery = await db.query(
            "SELECT emp_id, name, email, org_name, is_vehicle_registered, rider_type FROM users WHERE emp_id = $1",
            [emp_id]
        );
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const user = userQuery.rows[0];

        // If toggling to rider, check if vehicle credentials exist or are approved
        if (target_mode === 'rider' && user.is_vehicle_registered !== '2') {
            return res.status(403).json({ 
                success: false, 
                requires_verification: true,
                verification_status: user.is_vehicle_registered, // '0' = not registered, '1' = pending
                message: user.is_vehicle_registered === '1'
                    ? "Your driver credentials are currently pending admin verification."
                    : "Please upload your driver's license and vehicle registration to offer rides."
            });
        }

        await db.query("UPDATE users SET rider_type = $1 WHERE emp_id = $2", [target_mode, emp_id]);

        return res.json({
            success: true,
            rider_type: target_mode,
            message: target_mode === 'rider' ? "Switched to Driver Mode (Offering a Ride)" : "Switched to Passenger Mode (Finding a Ride)"
        });
    } catch (err) {
        return next(err);
    }
});

router.get("/me", FN_verifyTkn, async (req, res, next) => {
    try {
        const emp_id = req.user.emp_id;
        const userQuery = await db.query(
            `SELECT emp_id, name, email, org_name, phone, role, rider_type, is_vehicle_registered, address, 
                    passenger_rating, driving_rating, gender, designation, department, trust_score, total_rides_completed, co2_saved_kg 
             FROM users WHERE emp_id = $1`,
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