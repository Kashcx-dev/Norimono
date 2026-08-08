const fs = require('fs');
const path = require('path');
const db = require('../handlers/dbHandler');

async function runInit() {
    try {
        console.log('Connecting to database and executing init.sql...');
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        await db.query(sql);
        console.log('Database schema initialized successfully!');
        
        // Let's verify the tables exist
        const result = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('\\nExisting Tables in public schema:');
        result.rows.forEach(row => console.log(`- ${row.table_name}`));
        
        process.exit(0);
    } catch (error) {
        console.error('Error executing init.sql:');
        console.error(error.message);
        process.exit(1);
    }
}

runInit();
