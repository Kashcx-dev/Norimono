/**
 * Norimono Input Validation & Sanitization Engine
 * Strict type checking and format validation across all endpoints
 */

// 1. Phone Number: Strictly numeric, valid 10-digit Indian mobile or +91 standard
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return { valid: false, message: "Phone number is required." };
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if starts with +91 or 91
    let nationalNumber = cleaned;
    if (cleaned.startsWith('+91')) {
        nationalNumber = cleaned.slice(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        nationalNumber = cleaned.slice(2);
    }

    // Must be exactly 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(nationalNumber)) {
        return { 
            valid: false, 
            message: "Please enter a valid 10-digit mobile number (e.g. 9876543210). Cannot contain letters or symbols." 
        };
    }
    return { valid: true, value: nationalNumber };
}

// 2. Full Name: Alphabetical characters, spaces, dots, hyphens only. 2-60 chars.
function validateName(name) {
    if (!name || typeof name !== 'string') return { valid: false, message: "Full name is required." };
    const trimmed = name.trim();
    if (trimmed.length < 2) return { valid: false, message: "Name must be at least 2 characters long." };
    if (trimmed.length > 60) return { valid: false, message: "Name must not exceed 60 characters." };
    
    const nameRegex = /^[a-zA-Z\s.'-]+$/;
    if (!nameRegex.test(trimmed)) {
        return { 
            valid: false, 
            message: "Name can only contain alphabetical letters, spaces, and hyphens. Numbers and special characters are not allowed." 
        };
    }
    return { valid: true, value: trimmed };
}

// 3. Vehicle License Plate Number (RTO Format)
// e.g. KA-01-AB-1234, MH02CD5678, DL-01-A-1234, WB-02-AB-1234
function validateVehicleNo(vehNo) {
    if (!vehNo || typeof vehNo !== 'string') return { valid: false, message: "Vehicle plate number is required." };
    const cleaned = vehNo.trim().toUpperCase().replace(/[\s]/g, '-');
    
    // State code (2 letters) - RTO code (1-2 digits) - Series (1-3 letters) - Number (4 digits)
    const plateRegex = /^[A-Z]{2}[-]?[0-9]{1,2}[-]?[A-Z]{1,3}[-]?[0-9]{4}$/;
    if (!plateRegex.test(cleaned)) {
        return { 
            valid: false, 
            message: "Invalid vehicle plate number. Format must follow official RTO pattern (e.g. KA-01-AB-1234 or DL-04-A-9876)." 
        };
    }
    return { valid: true, value: cleaned };
}

// 4. Driving License Number
function validateDlNo(dlNo) {
    if (!dlNo || typeof dlNo !== 'string') return { valid: false, message: "Driving license number is required." };
    const cleaned = dlNo.trim().toUpperCase().replace(/[\s]/g, '-');
    
    // Standard DL format: 2-letter state code + alphanumeric sequence of 8-16 chars
    const dlRegex = /^[A-Z]{2}[-]?[0-9A-Z]{2}[-]?[0-9A-Z]{4,12}$/;
    if (!dlRegex.test(cleaned) || cleaned.length < 9) {
        return { 
            valid: false, 
            message: "Invalid Driving License number. Please enter a valid state-issued DL number (e.g. DL-0420110012345)." 
        };
    }
    return { valid: true, value: cleaned };
}

// 5. Corporate Email Validation
function validateCorporateEmail(email) {
    if (!email || typeof email !== 'string') return { valid: false, message: "Email is required." };
    const trimmed = email.trim().toLowerCase();
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
        return { valid: false, message: "Please enter a valid email address." };
    }

    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    const domain = trimmed.split('@')[1];
    if (publicDomains.includes(domain)) {
        return { 
            valid: false, 
            message: "Public email domains (@gmail, @yahoo, etc.) are restricted. Please enter your official corporate email address." 
        };
    }

    return { valid: true, value: trimmed };
}

// 6. Available Seating Capacity
function validateSeats(seats) {
    const num = parseInt(seats, 10);
    if (isNaN(num) || num < 1 || num > 7) {
        return { valid: false, message: "Seating capacity must be a whole number between 1 and 7 seats." };
    }
    return { valid: true, value: num };
}

// 7. Fuel Consumption Ratio
function validateFuelRatio(ratio) {
    const num = parseFloat(ratio);
    if (isNaN(num) || num < 0.3 || num > 3.0) {
        return { valid: false, message: "Fuel consumption ratio must be between 0.3 and 3.0." };
    }
    return { valid: true, value: num };
}

// 8. General String Sanitizer
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
}

module.exports = {
    validatePhone,
    validateName,
    validateVehicleNo,
    validateDlNo,
    validateCorporateEmail,
    validateSeats,
    validateFuelRatio,
    sanitizeString
};

