const express = require('express');
const multer = require('multer');
const { addProduct, getProducts, getProductByCode, restockProduct, deleteProduct } = require('../controllers/productController');
const router = express.Router();
const path = require('path');
const fs = require('fs');

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Add a new product
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         description: Product image
 *       - in: formData
 *         name: code
 *         type: string
 *       - in: formData
 *         name: name
 *         type: string
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/', upload.single('image'), addProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/{code}:
 *   get:
 *     summary: Get product by code (barcode scan)
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product info
 */
router.patch('/:id/restock', restockProduct);
router.delete('/:id', deleteProduct);

router.get('/:code', getProductByCode);

module.exports = router;
