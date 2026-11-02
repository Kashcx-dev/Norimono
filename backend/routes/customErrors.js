const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');

// Standard error codes and descriptions
const ERROR_CATALOG = {
    VALIDATION_ERROR: {
        status: 400,
        description: "Payload failed schema validation. One or more fields are invalid or missing."
    },
    INVALID_PHONE_FORMAT: {
        status: 400,
        description: "Phone number is not a valid 10-digit mobile number or contains letters/symbols."
    },
    INVALID_VEHICLE_NO: {
        status: 400,
        description: "Vehicle plate does not match valid RTO license plate standards."
    },
    INVALID_NAME: {
        status: 400,
        description: "Full name contains numbers or illegal characters. Must be 2-60 letters."
    },
    UNAUTHORIZED: {
        status: 401,
        description: "Authentication token missing or invalid. Please login."
    },
    FORBIDDEN: {
        status: 403,
        description: "Authenticated user lacks permission to access this resource."
    },
    ENDPOINT_NOT_FOUND: {
        status: 404,
        description: "The requested route does not exist."
    },
    RIDE_FULL: {
        status: 409,
        description: "Seat reservation failed: all seats on this ride have already been booked."
    },
    DUPLICATE_BOOKING: {
        status: 409,
        description: "User already has an active booking on this ride."
    },
    INSUFFICIENT_FUNDS: {
        status: 402,
        description: "Wallet balance is lower than the required escrow fare amount."
    },
    RATE_LIMIT_EXCEEDED: {
        status: 429,
        description: "Too many requests. Please throttle client actions."
    },
    INTERNAL_SERVER_ERROR: {
        status: 500,
        description: "Unexpected exception on server."
    }
};

// 1. Error Codes Catalog Endpoint
router.get('/errors/catalog', (req, res) => {
    return res.json({
        success: true,
        catalog: ERROR_CATALOG,
        count: Object.keys(ERROR_CATALOG).length,
        timestamp: new Date().toISOString()
    });
});

// 2. Health Check Diagnostic Endpoint
router.get('/health', async (req, res) => {
    let dbStatus = "connected";
    let dbLatencyMs = 0;
    const start = Date.now();
    try {
        await db.query('SELECT 1');
        dbLatencyMs = Date.now() - start;
    } catch (err) {
        dbStatus = `disconnected (${err.message})`;
    }

    return res.json({
        success: true,
        service: "Norimono Enterprise Mobility Platform",
        status: dbStatus === "connected" ? "healthy" : "degraded",
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            status: dbStatus,
            latency_ms: dbLatencyMs
        },
        environment: process.env.NODE_ENV || "development"
    });
});

module.exports = router;
