const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const db = require("../handlers/dbHandler");

/* HASHING FUNCTIONS */
async function Hash_Pass(password) {
    const saltRounds = parseInt(process.env.CRYPT_SALT || "10");
    const salt = await bcrypt.genSalt(isNaN(saltRounds) ? 10 : saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

function validatePassword(password) {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*]/.test(password)) return false;
    return true;
}

async function Compare_Pass(password, hash) {
    const result = await bcrypt.compare(password, hash);
    return result;
}

const getTimeAndDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const date = `${day}-${month}-${year}`;
    const time = `${hours}:${minutes}:${seconds}`;

    return `(${date}) - (${time})`;
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

router.post("/login", async (req, res, next) => {
    console.log(`Trying to Login via inbuilt auth route...${getTimeAndDate()}`);
    const { username, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE user_id = $1 OR email = $2', [username, username]);
        const user = result.rows[0];

        if (user) {
            const isMatch = await Compare_Pass(password, user.password);
            if (isMatch) {
                const email = user.email;
                if (!email) {
                    res.statusCode = 400;
                    return next(new Error("No email found for this user to send OTP."));
                }

                const otp = crypto.randomInt(100000, 999999).toString();
                const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

                // Save the vault details into the OTP store so we can send them back after OTP verification
                otpStore.set(user.user_id, { 
                    code: otp, 
                    expiresAt, 
                    email,
                    vault: {
                        encrypted_private_key: user.encrypted_private_key,
                        key_salt: user.key_salt,
                        key_iv: user.key_iv
                    }
                });

                try {
                    await transporter.sendMail({
                        from: `"InstaKG" <${process.env.EMAIL_USER}>`,
                        to: email,
                        subject: "Your Login OTP for InstaKG",
                        text: `Your OTP for login is: ${otp}. Valid for 5 minutes.`
                    });
                    
                    return res.json({ 
                        success: true, 
                        message: `OTP sent successfully to ${email}.`,
                        requires2FA: true,
                        resolvedUsername: user.user_id
                    });
                } catch (emailErr) {
                    console.error("Failed to send OTP email:", emailErr);
                    res.statusCode = 500;
                    return next(new Error("Failed to send OTP email. Please check server configuration."));
                }
            } else {
                res.statusCode = 401;
                return next(new Error("Incorrect password"));
            }
        } else {
            res.statusCode = 400;
            return next(new Error("Username/Email not found, Please signup first!"));
        }
    } catch (err) {
        return next(err);
    }
});

// Verify Login OTP
router.post("/verify-otp", (req, res, next) => {
    const { username, otp } = req.body;
    const record = otpStore.get(username);

    if (!record) {
        res.statusCode = 400;
        return next(new Error("No OTP requested or session expired. Please log in again."));
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(username);
        res.statusCode = 400;
        return next(new Error("OTP has expired. Please log in again."));
    }

    if (record.code === otp) {
        const vault = record.vault;
        otpStore.delete(username); 
        
        // Issue JWT
        const user_data = { username };
        const token = jwt.sign(user_data, process.env.JWT_SECRET, { expiresIn: "1hr" });
        
        // Return the token AND the encrypted vault
        return res.json({ 
            success: true, 
            message: "Successfully Logged In!", 
            token: token,
            ...vault
        });
    }

    res.statusCode = 400;
    return next(new Error("Invalid OTP. Please try again."));
});

// Signup Route (Sends OTP, stores info in temp map)
router.post("/signup", async (req, res, next) => {
    console.log(`Sign up via Router/signup ... ${getTimeAndDate()}`);
    // Extract our new crypto keys from the frontend payload!
    const { username, email, password, public_key, encrypted_private_key, key_salt, key_iv } = req.body;

    if (!username || username.trim() == "") return next(new Error("Username is required."));
    if (!email || email.trim() == "") return next(new Error("Email is required."));
    if (!password || password.trim() == "") return next(new Error("Password is required."));
    if (!public_key) return next(new Error("E2EE Public Key is required."));

    try {
        const result = await db.query('SELECT * FROM users WHERE user_id = $1 OR email = $2', [username, email]);
        if (result.rows[0]) {
            res.statusCode = 400;
            return next(new Error("Username or Email already exists."));
        }

        const hashedPassword = await Hash_Pass(password);
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;

        // Store the crypto vault bundle in signupStore
        signupStore.set(username, { 
            email, 
            hashedPassword, 
            code: otp, 
            expiresAt,
            public_key,
            encrypted_private_key,
            key_salt,
            key_iv
        });

        try {
            await transporter.sendMail({
                from: `"InstaKG" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Verify Your InstaKG Account",
                text: `Your verification OTP is: ${otp}. Valid for 5 minutes.`
            });

            return res.json({ 
                success: true, 
                message: `Verification OTP sent to ${email}.`,
                requires2FA: true 
            });
        } catch (emailErr) {
            console.error("Failed to send signup OTP email:", emailErr);
            res.statusCode = 500;
            return next(new Error("Failed to send verification email. Please check server configuration."));
        }
    } catch (err) {
        return next(err);
    }
});

// Verify Signup OTP and create user in DB
router.post("/verify-signup-otp", async (req, res, next) => {
    const { username, otp } = req.body;
    const record = signupStore.get(username);

    if (!record) {
        res.statusCode = 400;
        return next(new Error("No signup verification session found. Please register again."));
    }

    if (Date.now() > record.expiresAt) {
        signupStore.delete(username);
        res.statusCode = 400;
        return next(new Error("Verification session expired. Please register again."));
    }

    if (record.code === otp) {
        try {
            await db.query('BEGIN');

            // Save EVERYTHING to DB (including the keys)
            await db.query(
                `INSERT INTO users (user_id, email, password, public_key, encrypted_private_key, key_salt, key_iv) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
                [username, record.email, record.hashedPassword, record.public_key, record.encrypted_private_key, record.key_salt, record.key_iv]
            );
            
            // Automatically create a conversation with the IKG Bot
            const convId = crypto.randomUUID();
            await db.query(
                `INSERT INTO conversations (id, is_group, created_at) VALUES ($1, false, $2)`,
                [convId, Date.now()]
            );
            
            await db.query(
                `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
                [convId, username, 'ikg_bot']
            );

            await db.query('COMMIT');
            signupStore.delete(username);

            // Issue JWT
            const user_data = { username };
            const token = jwt.sign(user_data, process.env.JWT_SECRET, { expiresIn: "1hr" });

            return res.json({ 
                success: true, 
                message: "Signed up and logged in successfully!", 
                token: token 
            });
        } catch (err) {
            await db.query('ROLLBACK');
            return next(err);
        }
    }

    res.statusCode = 400;
    return next(new Error("Invalid verification code. Please try again."));
});

module.exports = router;