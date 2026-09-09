const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const { Pool } = require("pg");

console.log("NEONDB exists:", !!process.env.NEONDB);

const pool = new Pool({
    connectionString: process.env.NEONDB
});

pool.query("SELECT NOW()")
    .then((result) => {
        console.log("Connected to Neon PostgreSQL");
        console.log("Database Time:", result.rows[0].now);
    })
    .catch((error) => {
        console.error("Neon connection failed:", error.message);
    });

module.exports = pool;