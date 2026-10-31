const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initSupabase(targetUri) {
    const connStr = targetUri || process.env.DB_URI;
    if (!connStr || connStr.includes('[YOUR-PASSWORD]')) {
        console.error("Error: DB_URI is missing the actual database password.");
        console.error("Please provide the connection string with your Supabase database password:");
        console.error("node backend/utils/initSupabase.js \"postgresql://postgres:YOUR_PASSWORD@db.lngniknfsglowuujydid.supabase.co:5432/postgres\"");
        process.exit(1);
    }

    console.log("Connecting to Supabase PostgreSQL database...");
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✓ Connected to Supabase successfully!");

        console.log("Executing init.sql on Supabase...");
        const sqlPath = path.join(__dirname, '../database/init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);
        console.log("✓ All Norimono tables and default settings initialized on Supabase!");

        // Verify tables
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log("✓ Verified Supabase public tables:", res.rows.map(r => r.table_name));

        await client.end();
        console.log("🎉 Supabase database initialization complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to initialize Supabase:", err.message);
        try { await client.end(); } catch (e) {}
        process.exit(1);
    }
}

const inputUri = process.argv[2];
initSupabase(inputUri);

