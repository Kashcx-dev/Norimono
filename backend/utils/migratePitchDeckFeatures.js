const db = require('../handlers/dbHandler');
const bcrypt = require('bcrypt');

async function migratePitchDeckFeatures() {
    try {
        console.log("Adding pitch deck columns to users and rides...");

        // 1. Add gender to users if not exists
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'unspecified',
            ADD COLUMN IF NOT EXISTS designation VARCHAR(100) DEFAULT 'Software Engineer',
            ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Engineering',
            ADD COLUMN IF NOT EXISTS trust_score DECIMAL(4, 1) DEFAULT 99.4,
            ADD COLUMN IF NOT EXISTS total_rides_completed INT DEFAULT 18,
            ADD COLUMN IF NOT EXISTS co2_saved_kg DECIMAL(6, 1) DEFAULT 42.5;
        `);

        // 2. Add columns to rides
        await db.query(`
            ALTER TABLE rides 
            ADD COLUMN IF NOT EXISTS is_female_only BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS destination_tech_park VARCHAR(150) DEFAULT 'Manyata Tech Park',
            ADD COLUMN IF NOT EXISTS allow_neighbor_companies BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS target_arrival_time VARCHAR(20) DEFAULT '08:50 AM';
        `);

        // 3. Ensure corporate tech companies exist in org_settings
        const companies = [
            { name: 'TCS', fuel: 5.50, subsidy: 2.50 },
            { name: 'Infosys', fuel: 5.50, subsidy: 2.20 },
            { name: 'Wipro', fuel: 5.50, subsidy: 2.00 },
            { name: 'Google', fuel: 5.50, subsidy: 3.50 },
            { name: 'Microsoft', fuel: 5.50, subsidy: 3.50 },
            { name: 'Accenture', fuel: 5.50, subsidy: 2.25 },
            { name: 'Cognizant', fuel: 5.50, subsidy: 2.00 },
            { name: 'Odoo', fuel: 5.50, subsidy: 2.00 },
        ];

        for (const comp of companies) {
            await db.query(`
                INSERT INTO org_settings (org_name, fuel_cost_per_km, travel_cost_per_km)
                VALUES ($1, $2, $3)
                ON CONFLICT (org_name) DO UPDATE 
                SET fuel_cost_per_km = EXCLUDED.fuel_cost_per_km, travel_cost_per_km = EXCLUDED.travel_cost_per_km;
            `, [comp.name, comp.fuel, comp.subsidy]);
        }

        // 4. Seed verified corporate drivers across top companies with realistic routes
        const salt = await bcrypt.genSalt(10);
        const demoHash = await bcrypt.hash("norimono123", salt);

        const demoDrivers = [
            {
                emp_id: "EMP-TCS-01",
                name: "Ananya Sharma",
                email: "ananya.s@tcs.com",
                org_name: "TCS",
                gender: "female",
                designation: "Senior Cloud Architect",
                department: "BFSI Tech",
                phone: "9876543210",
                veh_no: "KA-04-MB-4122",
                vehicle_model: "Tata Nexon EV (Electric)",
                seating_capacity: 4,
                fuel_ratio: 0.8,
                trust_score: 99.8,
                rides_completed: 46,
                co2_saved_kg: 112.4,
                ride: {
                    origin: { name: "Indiranagar 100ft Rd, Bangalore", lat: 12.9784, lng: 77.6408 },
                    destination: { name: "Manyata Tech Park, Nagavara", lat: 13.0475, lng: 77.6212 },
                    departure_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
                    target_arrival_time: "08:50 AM",
                    tech_park: "Manyata Tech Park",
                    total_seats: 4,
                    available_seats: 3,
                    fare_per_seat: 42.00,
                    subsidy_per_seat: 18.00,
                    is_female_only: true,
                    status: "scheduled"
                }
            },
            {
                emp_id: "EMP-INF-02",
                name: "Rohan Kulkarni",
                email: "rohan.k@infosys.com",
                org_name: "Infosys",
                gender: "male",
                designation: "Principal Consultant",
                department: "Enterprise AI",
                phone: "9876543211",
                veh_no: "KA-01-MJ-8890",
                vehicle_model: "Hyundai Creta SX (Petrol)",
                seating_capacity: 5,
                fuel_ratio: 1.1,
                trust_score: 99.2,
                rides_completed: 38,
                co2_saved_kg: 89.0,
                ride: {
                    origin: { name: "Koramangala 4th Block, Bangalore", lat: 12.9345, lng: 77.6266 },
                    destination: { name: "Electronic City Phase 1, Bangalore", lat: 12.8452, lng: 77.6602 },
                    departure_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    target_arrival_time: "09:05 AM",
                    tech_park: "Electronic City Phase 1",
                    total_seats: 4,
                    available_seats: 2,
                    fare_per_seat: 48.00,
                    subsidy_per_seat: 20.00,
                    is_female_only: false,
                    status: "scheduled"
                }
            },
            {
                emp_id: "EMP-WIP-03",
                name: "Pooja Varma",
                email: "pooja.v@wipro.com",
                org_name: "Wipro",
                gender: "female",
                designation: "Lead UX Designer",
                department: "Digital Experience",
                phone: "9876543212",
                veh_no: "KA-05-NN-1092",
                vehicle_model: "Honda City Hybrid",
                seating_capacity: 4,
                fuel_ratio: 0.9,
                trust_score: 100.0,
                rides_completed: 62,
                co2_saved_kg: 148.2,
                ride: {
                    origin: { name: "HSR Layout Sector 2, Bangalore", lat: 12.9116, lng: 77.6389 },
                    destination: { name: "RMZ Ecospace, Bellandur ORR", lat: 12.9260, lng: 77.6834 },
                    departure_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    target_arrival_time: "08:45 AM",
                    tech_park: "RMZ Ecospace",
                    total_seats: 3,
                    available_seats: 2,
                    fare_per_seat: 38.00,
                    subsidy_per_seat: 16.00,
                    is_female_only: true,
                    status: "scheduled"
                }
            },
            {
                emp_id: "EMP-GOOG-04",
                name: "Vikram Sengupta",
                email: "vikram@google.com",
                org_name: "Google",
                gender: "male",
                designation: "Staff Software Engineer",
                department: "Google Cloud Core",
                phone: "9876543213",
                veh_no: "KA-51-AB-7711",
                vehicle_model: "MG ZS EV (Electric)",
                seating_capacity: 4,
                fuel_ratio: 0.7,
                trust_score: 99.6,
                rides_completed: 71,
                co2_saved_kg: 210.5,
                ride: {
                    origin: { name: "Whitefield Inner Circle, Bangalore", lat: 12.9698, lng: 77.7499 },
                    destination: { name: "Bagmane Constellation Tech Park, ORR", lat: 12.9868, lng: 77.6974 },
                    departure_time: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
                    target_arrival_time: "09:00 AM",
                    tech_park: "Bagmane Tech Park",
                    total_seats: 4,
                    available_seats: 3,
                    fare_per_seat: 45.00,
                    subsidy_per_seat: 25.00,
                    is_female_only: false,
                    status: "in_progress" // active en-route driver on the road!
                }
            }
        ];

        for (const drv of demoDrivers) {
            // Upsert user
            await db.query(`
                INSERT INTO users (
                    emp_id, name, email, org_name, phone, role, rider_type,
                    is_vehicle_registered, password_hash, gender, designation, department,
                    trust_score, total_rides_completed, co2_saved_kg
                ) VALUES ($1, $2, $3, $4, $5, 'employee', 'rider', '2', $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (email) DO UPDATE 
                SET gender = EXCLUDED.gender,
                    designation = EXCLUDED.designation,
                    department = EXCLUDED.department,
                    is_vehicle_registered = '2',
                    trust_score = EXCLUDED.trust_score,
                    total_rides_completed = EXCLUDED.total_rides_completed,
                    co2_saved_kg = EXCLUDED.co2_saved_kg;
            `, [
                drv.emp_id, drv.name, drv.email, drv.org_name, drv.phone,
                demoHash, drv.gender, drv.designation, drv.department,
                drv.trust_score, drv.rides_completed, drv.co2_saved_kg
            ]);

            // Upsert vehicle
            await db.query(`
                INSERT INTO vehicles (veh_id, veh_no, emp_id, dl_no, vehicle_model, seating_capacity, fuel_consumption_ratio)
                VALUES ($1, $2, $3, 'DL-KA-DEMO-999', $4, $5, $6)
                ON CONFLICT (veh_no) DO UPDATE 
                SET vehicle_model = EXCLUDED.vehicle_model, seating_capacity = EXCLUDED.seating_capacity;
            `, [`VH-${drv.emp_id}`, drv.veh_no, drv.emp_id, drv.vehicle_model, drv.seating_capacity, drv.fuel_ratio]);

            // Upsert wallet
            await db.query(`
                INSERT INTO wallets (emp_id, balance) 
                VALUES ($1, 850.00)
                ON CONFLICT (emp_id) DO NOTHING;
            `, [drv.emp_id]);

            // Check if demo ride already exists
            const rCheck = await db.query(`SELECT ride_id FROM rides WHERE driver_id = $1 AND status IN ('scheduled', 'in_progress')`, [drv.emp_id]);
            if (rCheck.rows.length === 0) {
                // Approximate a polyline between origin and destination
                const oLat = drv.ride.origin.lat;
                const oLng = drv.ride.origin.lng;
                const dLat = drv.ride.destination.lat;
                const dLng = drv.ride.destination.lng;
                const midLat = (oLat + dLat) / 2 + 0.005;
                const midLng = (oLng + dLng) / 2 - 0.005;
                const samplePolyline = JSON.stringify([
                    [oLat, oLng],
                    [(oLat * 2 + midLat) / 3, (oLng * 2 + midLng) / 3],
                    [midLat, midLng],
                    [(midLat + dLat * 2) / 3, (midLng + dLng * 2) / 3],
                    [dLat, dLng]
                ]);

                await db.query(`
                    INSERT INTO rides (
                        driver_id, veh_no, origin, destination,
                        departure_time, total_seats, available_seats,
                        fare_per_seat, subsidy_per_seat, status, polyline,
                        is_female_only, destination_tech_park, allow_neighbor_companies
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE);
                `, [
                    drv.emp_id, drv.veh_no, JSON.stringify(drv.ride.origin), JSON.stringify(drv.ride.destination),
                    drv.ride.departure_time, drv.ride.total_seats, drv.ride.available_seats,
                    drv.ride.fare_per_seat, drv.ride.subsidy_per_seat, drv.ride.status, samplePolyline,
                    drv.ride.is_female_only, drv.ride.tech_park
                ]);
            }
        }

        console.log("Migration and demo data seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err.message);
        process.exit(1);
    }
}

migratePitchDeckFeatures();
