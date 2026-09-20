const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "..", ".env")
});

const { Pool } = require("pg");

console.log("NEONDB exists:", !!process.env.NEONDB);

const pool = new Pool({
    connectionString: process.env.NEONDB
});

module.exports = pool;