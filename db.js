const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
      }
    : {
          user: process.env.DB_USER,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
      };

const pool = new Pool(poolConfig);

const initDB = async () => {
    try {
        const client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                code VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                size REAL DEFAULT 0,
                quantity REAL DEFAULT 0,
                cost_usd REAL DEFAULT 0,
                cost_som REAL DEFAULT 0,
                sale_usd REAL DEFAULT 0,
                sale_som REAL DEFAULT 0,
                dollar_rate REAL DEFAULT 12500,
                category VARCHAR(100),
                total_area REAL DEFAULT 0,
                image_url VARCHAR(255)
            );

            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                quantity REAL NOT NULL,
                area REAL DEFAULT 0,
                som REAL NOT NULL,
                usd REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        client.release();
        console.log("Database initialized successfully!");
    } catch (err) {
        console.error("Error initializing DB", err);
    }
};

module.exports = { pool, initDB };
