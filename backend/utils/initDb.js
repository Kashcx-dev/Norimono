const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setup() {
    console.log("Checking Postgres server...");
    const rootClient = new Client({
        connectionString: 'postgresql://postgres:password@localhost:5432/postgres'
    });
    await rootClient.connect();
    const checkDb = await rootClient.query("SELECT 1 FROM pg_database WHERE datname='norimono'");
    if (checkDb.rows.length === 0) {
        console.log("Creating database 'norimono'...");
        await rootClient.query('CREATE DATABASE norimono');
    } else {
        console.log("Database 'norimono' exists.");
    }
    await rootClient.end();

    console.log("Connecting to 'norimono' database...");
    const appClient = new Client({
        connectionString: 'postgresql://postgres:password@localhost:5432/norimono'
    });
    await appClient.connect();

    // Check if users table exists
    const checkUsers = await appClient.query("SELECT 1 FROM information_schema.tables WHERE table_name='users'");
    if (checkUsers.rows.length === 0) {
        console.log("Executing init.sql to initialize schema...");
        const sqlPath = path.join(__dirname, '../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await appClient.query(sql);
        console.log("Schema initialized successfully.");
    } else {
        console.log("Users table exists. Checking rider_type column & rider_verifications table...");
        await appClient.query(`
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
        await appClient.query(`
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
        console.log("rider_verifications and rider_type verified.");
    }

    // Verify existing tables
    const tables = await appClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("Public tables:", tables.rows.map(r => r.table_name));

    await appClient.end();
    console.log("Setup complete!");
}

setup().catch(err => {
    console.error("Setup failed:", err);
    process.exit(1);
});

