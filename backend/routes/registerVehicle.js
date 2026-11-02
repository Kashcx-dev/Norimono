const express = require('express');
const router = express.Router();
const db = require('../handlers/dbHandler');
const crypto = require('crypto');
const { sendError } = require('../handlers/middlewareHandler');
const { validateVehicleNo, validateDlNo, validateSeats, validateFuelRatio } = require('../utils/validator');

// GET /register-vehicle - Fetch registered vehicle & current review status
router.get('/', async (req, res, next) => {
    try {
        if (!req.user || !req.user.emp_id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userRes = await db.query(
            'SELECT is_vehicle_registered, rider_type, name, org_name FROM users WHERE emp_id = $1',
            [req.user.emp_id]
        );
        const isRegistered = userRes.rows[0]?.is_vehicle_registered || '0';

        const vehRes = await db.query(
            'SELECT * FROM vehicles WHERE emp_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.user.emp_id]
        );

        return res.json({
            success: true,
            is_vehicle_registered: isRegistered,
            user: userRes.rows[0],
            vehicle: vehRes.rows[0] || null
        });
    } catch (err) {
        console.error("Error fetching registered vehicle:", err);
        return next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        if(!req.user || !req.user.emp_id){
            return res.status(401).json({message: "User is not Authenticated"});
        }

        const driver_id = req.user.emp_id;
        const { vehicle_no, DL_no, vehicle_model, max_seating_cap, fuel_consumption_ratio, insurance_no } = req.body;
        
        // Strict Field Validation
        const vehCheck = validateVehicleNo(vehicle_no);
        if (!vehCheck.valid) {
            return sendError(res, 400, "INVALID_VEHICLE_NUMBER", vehCheck.message, { field: "vehicle_no" });
        }

        const dlCheck = validateDlNo(DL_no);
        if (!dlCheck.valid) {
            return sendError(res, 400, "INVALID_DL_NUMBER", dlCheck.message, { field: "DL_no" });
        }

        if (!vehicle_model || typeof vehicle_model !== 'string' || !vehicle_model.trim()) {
            return sendError(res, 400, "MISSING_VEHICLE_MODEL", "Please provide a certified vehicle model.", { field: "vehicle_model" });
        }

        const seatCheck = validateSeats(max_seating_cap);
        if (!seatCheck.valid) {
            return sendError(res, 400, "INVALID_SEAT_CAPACITY", seatCheck.message, { field: "max_seating_cap" });
        }

        const fuelCheck = validateFuelRatio(fuel_consumption_ratio || 1.0);
        if (!fuelCheck.valid) {
            return sendError(res, 400, "INVALID_FUEL_RATIO", fuelCheck.message, { field: "fuel_consumption_ratio" });
        }

        // Check if the user already has a vehicle registered
        const existingVehicle = await db.query('SELECT veh_id FROM vehicles WHERE emp_id = $1', [driver_id]);
        if (existingVehicle.rows.length > 0) {
            return sendError(res, 409, "VEHICLE_ALREADY_REGISTERED", "You already have a vehicle registered. Norimono currently supports one vehicle per user.");
        }

        // Check if vehicle plate is already in use by another driver
        const existingPlate = await db.query('SELECT veh_id FROM vehicles WHERE veh_no = $1', [vehCheck.value]);
        if (existingPlate.rows.length > 0) {
            return sendError(res, 409, "PLATE_ALREADY_REGISTERED", "This vehicle plate is already registered to another employee.");
        }

        // Generate unique vehicle ID
        const veh_id = 'VEH-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        // Start transaction
        await db.query('BEGIN');

        // Insert vehicle
        await db.query(
            `INSERT INTO vehicles (
                veh_id, veh_no, emp_id, insurance_no, dl_no, vehicle_model, seating_capacity, fuel_consumption_ratio
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                veh_id,
                vehCheck.value,
                driver_id,
                insurance_no ? insurance_no.trim().toUpperCase() : null,
                dlCheck.value,
                vehicle_model.trim(),
                seatCheck.value,
                fuelCheck.value
            ]
        );

        // Update user profile to pending status
        await db.query(
            'UPDATE users SET is_vehicle_registered = $1 WHERE emp_id = $2',
            ['1', driver_id]
        );

        await db.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: "Vehicle registered successfully",
            veh_id: veh_id
        });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error in registerVehicle:", error);
        
        // Handle unique constraint violation on vehicle number
        if(error.code === '23505' && error.constraint === 'vehicles_veh_no_key') {
             return res.status(400).json({message: "This vehicle number is already registered by another user."});
        }
        
        return next(error);
    }
});

module.exports = router;

//fare = approx milage * total distance + (approx_milage*total distance ) * 0.15 + offset