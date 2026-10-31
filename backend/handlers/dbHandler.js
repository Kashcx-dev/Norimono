const { Pool } = require("pg");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

// Postgres connection string should be in your .env file as DB_URI
const dbUri = process.env.DB_URI || "";
const isRemoteDb = dbUri.includes("supabase.co") || 
                   dbUri.includes("sslmode=require") || 
                   dbUri.includes("pooler.supabase.com") ||
                   process.env.DB_SSL === "true";

const pool = new Pool({
    connectionString: dbUri,
    ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool: pool
};
