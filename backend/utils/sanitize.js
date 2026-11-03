const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes user input strings to prevent XSS attacks using DOMPurify
 */
function sanitizeInput(str) {
    if (typeof str !== "string") return str;
    return DOMPurify.sanitize(str.trim());
}

/**
 * Recursively sanitizes objects and arrays, stripping XSS payloads while preserving raw password fields
 */
function sanitizeData(data) {
    if (!data) return data;
    if (typeof data === "string") {
        return DOMPurify.sanitize(data.trim());
    }
    if (Array.isArray(data)) {
        return data.map((item) => sanitizeData(item));
    }
    if (typeof data === "object") {
        const sanitized = {};
        for (const [key, val] of Object.entries(data)) {
            // Keep raw password fields untouched so special chars (!, @, <, >) don't get modified before bcrypt
            if (key.toLowerCase().includes("password")) {
                sanitized[key] = typeof val === "string" ? val : "";
            } else {
                sanitized[key] = sanitizeData(val);
            }
        }
        return sanitized;
    }
    return data;
}

/**
 * Global Express middleware applying recursive DOMPurify XSS protection across body, query, and params
 */
function xssSanitizerMiddleware(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = sanitizeData(req.body);
    }
    if (req.query && typeof req.query === "object") {
        req.query = sanitizeData(req.query);
    }
    if (req.params && typeof req.params === "object") {
        req.params = sanitizeData(req.params);
    }
    next();
}

module.exports = { sanitizeInput, sanitizeData, xssSanitizerMiddleware, DOMPurify };
