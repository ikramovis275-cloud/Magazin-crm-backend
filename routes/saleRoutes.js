const express = require('express');
const { addSale, getSales, returnSale } = require('../controllers/saleController');
const router = express.Router();

router.post('/', addSale);
router.get('/', getSales);
router.post('/:id/return', returnSale);

module.exports = router;
