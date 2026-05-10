const express = require('express');
const { getDailyReports, getDashboardStats } = require('../controllers/reportController');
const router = express.Router();

/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     summary: Get daily reports
 *     responses:
 *       200:
 *         description: Reports data
 */
router.get('/daily', getDailyReports);

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', getDashboardStats);

module.exports = router;
