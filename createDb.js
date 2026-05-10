const { Pool } = require('pg');
require('dotenv').config();

const createDB = async () => {
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', // connect to default
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        const client = await pool.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log("Database created!");
        } else {
            console.log("Database already exists.");
        }
        client.release();
    } catch (err) {
        console.error("Error creating DB", err);
    } finally {
        await pool.end();
    }
};

createDB();
