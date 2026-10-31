const db = require('../handlers/dbHandler');

async function checkAndMigrate() {
    try {
        console.log("Checking DB connection and schema...");
        
        // 1. Check if rider_type column exists on users
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='users' AND column_name='rider_type'
                ) THEN 
                    ALTER TABLE users ADD COLUMN rider_type VARCHAR(20) NOT NULL DEFAULT 'passenger';
                END IF; 
            END $$;
        `);

        // 2. Check if rider_verifications table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS rider_verifications (
                verification_id SERIAL PRIMARY KEY,
                emp_id VARCHAR(50) REFERENCES users(emp_id) ON DELETE CASCADE,
                dl_no VARCHAR(50) NOT NULL,
                vehicle_no VARCHAR(50) NOT NULL,
                vehicle_model VARCHAR(100) NOT NULL,
                seating_capacity INT NOT NULL DEFAULT 4,
                fuel_consumption_ratio DECIMAL(5, 2) DEFAULT 1.0,
                insurance_no VARCHAR(50),
                status VARCHAR(20) DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP
            );
        `);

        console.log("Database schema check & migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("DB check error:", err);
        process.exit(1);
    }
}

checkAndMigrate();
