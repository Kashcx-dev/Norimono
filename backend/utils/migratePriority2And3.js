const db = require('../handlers/dbHandler');

async function migrate() {
    console.log("Migrating database for Priority #2 & #3...");

    // 1. Add subsidy_per_seat to rides if not exists
    await db.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='rides' AND column_name='subsidy_per_seat'
            ) THEN 
                ALTER TABLE rides ADD COLUMN subsidy_per_seat DECIMAL(10, 2) DEFAULT 0.00;
            END IF; 
        END $$;
    `);

    // 2. Add fare_amount and is_en_route to bookings if not exists
    await db.query(`
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='bookings' AND column_name='fare_amount'
            ) THEN 
                ALTER TABLE bookings ADD COLUMN fare_amount DECIMAL(10, 2);
            END IF; 

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='bookings' AND column_name='is_en_route'
            ) THEN 
                ALTER TABLE bookings ADD COLUMN is_en_route BOOLEAN DEFAULT FALSE;
            END IF; 
        END $$;
    `);

    // 3. Create wallet_transactions table if not exists
    await db.query(`
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            transaction_id SERIAL PRIMARY KEY,
            emp_id VARCHAR(50) REFERENCES users(emp_id) ON DELETE CASCADE,
            ride_id INT REFERENCES rides(ride_id) ON DELETE SET NULL,
            type VARCHAR(30) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log("✓ Database migration for Priority #2 & #3 completed successfully!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});

