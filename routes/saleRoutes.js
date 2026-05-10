const express = require('express');
const { addSale, getSales } = require('../controllers/saleController');
const router = express.Router();

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Record a sale
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               sell_quantity:
 *                 type: number
 *               sell_area:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sale recorded
 */
router.post('/', addSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     responses:
 *       200:
 *         description: Sales retrieved
 */
router.get('/', getSales);

module.exports = router;
