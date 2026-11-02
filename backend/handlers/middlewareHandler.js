const jwt = require("jsonwebtoken");
const rate_limiter = require('express-rate-limit');

// Pre-defined limits (dynamic by level)
const limits = {
    strict:   { windowMs: 15 * 60 * 1000, max: 500 }, // Auth endpoints
    standard: { windowMs: 1 * 60 * 1000,  max: 60 },  // Standard API endpoints
    relaxed:  { windowMs: 10 * 1000,      max: 100 }  // Real-time Chat / Telemetry
};

const API_Limiter = (level = "standard") => {
    const config = limits[level] || limits.standard;
    return rate_limiter({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                status: 429,
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests from this client. Please slow down and try again shortly.",
                error: "Rate limit exceeded",
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        }
    });
};

// Helper for sending structured custom error responses
const sendError = (res, statusCode, errorCode, message, details = null) => {
    return res.status(statusCode).json({
        success: false,
        status: statusCode,
        code: errorCode,
        message: message,
        error: message,
        errors: details ? (Array.isArray(details) ? details : [details]) : undefined,
        timestamp: new Date().toISOString()
    });
};

const FN_verifyTkn = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = (authHeader && authHeader.split(" ")[1]) || (req.cookies && req.cookies.token);
    if (!token) {
        return res.status(401).json({
            success: false,
            status: 401,
            code: "UNAUTHORIZED",
            message: "Authentication required. Please sign in with your corporate account.",
            error: "Unauthorized",
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    }

    try {
        const verifyTkn = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verifyTkn;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            status: 403,
            code: "INVALID_SESSION",
            message: "Your session token has expired or is invalid. Please log in again.",
            error: "Forbidden",
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    }
};

const FN_verifyAdmin = (req, res, next) => {
    FN_verifyTkn(req, res, (err) => {
        if (err) return next(err);
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                status: 403,
                code: "ADMIN_ACCESS_REQUIRED",
                message: "Forbidden: Enterprise administrator access is required for this action.",
                error: "Forbidden",
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        }
    });
};

// Custom 404 handler for API endpoints
const handle404 = (req, res, next) => {
    res.status(404).json({
        success: false,
        status: 404,
        code: "ENDPOINT_NOT_FOUND",
        message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`,
        error: "Not Found",
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
};

// Master error handler with production formatting
const masterErrorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.status || 500);

    console.error(`[Server Error ${statusCode}] at ${req.method} ${req.originalUrl}:`, err.message);

    res.status(statusCode).json({
        success: false,
        status: statusCode,
        code: err.code || (statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR"),
        message: err.message || "An unexpected internal server error occurred.",
        error: err.message || "Internal Server Error",
        errors: err.errors || undefined,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    handle404,
    masterErrorHandler,
    sendError,
    FN_verifyTkn,
    FN_verifyAdmin,
    API_Limiter
};
