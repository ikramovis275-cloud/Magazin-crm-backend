const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM magazin_users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            // First time login - create admin user if no users exist
            const allUsers = await pool.query('SELECT * FROM magazin_users');
            if (allUsers.rows.length === 0) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
                const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1d' });
                return res.json({ token, message: 'Admin created and logged in' });
            }
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username, id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, message: 'Logged in successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

module.exports = { login };
