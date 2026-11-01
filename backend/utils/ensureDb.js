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

        // 3. Add BlaBlaCar replica features to rides table
        await db.query(`
            DO $$ 
            BEGIN 
                -- Preferences (chattiness, AC, smoking, music, luggage, max_two_back)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='rides' AND column_name='preferences'
                ) THEN 
                    ALTER TABLE rides ADD COLUMN preferences JSONB DEFAULT '{"chattiness":"blabla","ac":true,"smoking":false,"music":true,"luggage":"medium","max_two_back":true}'::jsonb;
                END IF;

                -- Intermediate Stopovers / En-route Waypoints
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='rides' AND column_name='stopovers'
                ) THEN 
                    ALTER TABLE rides ADD COLUMN stopovers JSONB DEFAULT '[]'::jsonb;
                END IF;

                -- Recurring Commute Flag (Mon-Fri)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='rides' AND column_name='is_recurring'
                ) THEN 
                    ALTER TABLE rides ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
                END IF;

                -- Instant Booking (BlaBlaCar instant seat confirmation)
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='rides' AND column_name='instant_booking'
                ) THEN 
                    ALTER TABLE rides ADD COLUMN instant_booking BOOLEAN DEFAULT TRUE;
                END IF;

                -- Bookings: Luggage and passenger commute notes
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='bookings' AND column_name='luggage_size'
                ) THEN 
                    ALTER TABLE bookings ADD COLUMN luggage_size VARCHAR(20) DEFAULT 'medium';
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='bookings' AND column_name='passenger_notes'
                ) THEN 
                    ALTER TABLE bookings ADD COLUMN passenger_notes TEXT;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='bookings' AND column_name='selected_stopover'
                ) THEN 
                    ALTER TABLE bookings ADD COLUMN selected_stopover VARCHAR(100);
                END IF;
            END $$;
        `);

        console.log("Database schema check & migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("DB check error:", err);
        process.exit(1);
    }
}

checkAndMigrate();
