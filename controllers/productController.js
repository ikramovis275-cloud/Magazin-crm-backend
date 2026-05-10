const { pool } = require('../db');

const addProduct = async (req, res) => {
    try {
        const { code, name, size, quantity, cost_usd, cost_som, sale_usd, sale_som, dollar_rate, category } = req.body;
        const total_area = (size && size <= 10) ? (size * quantity) : 0;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await pool.query(`
            INSERT INTO magazin_products 
            (code, name, size, quantity, cost_usd, cost_som, sale_usd, sale_som, dollar_rate, category, total_area, image_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [code, name, size, quantity, cost_usd, cost_som, sale_usd, sale_som, dollar_rate, category, total_area, image_url]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error adding product', error: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const { search } = req.query;
        let result;
        if (search) {
            // Search by name, code or category
            result = await pool.query(
                `SELECT * FROM magazin_products WHERE 
                    name ILIKE $1 OR 
                    code ILIKE $1 OR 
                    category ILIKE $1
                ORDER BY id DESC`,
                [`%${search}%`]
            );
        } else {
            result = await pool.query('SELECT * FROM magazin_products ORDER BY id DESC');
        }
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

const getProductByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const result = await pool.query('SELECT * FROM magazin_products WHERE code = $1', [code]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error finding product', error });
    }
};

const restockProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { add_quantity } = req.body;
        const qty = parseFloat(add_quantity);
        if (!qty || qty <= 0) return res.status(400).json({ message: "Miqdor noto'g'ri" });

        const result = await pool.query(
            `UPDATE magazin_products 
             SET quantity = quantity + $1,
                 total_area = CASE WHEN size IS NOT NULL AND size > 0 AND size <= 10
                                   THEN (quantity + $1) * size
                                   ELSE total_area END
             WHERE id = $2 RETURNING *`,
            [qty, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Mahsulot topilmadi' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Xatolik', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM magazin_products WHERE id = $1', [id]);
        res.json({ message: "Product deleted" });
    } catch (error) {
        res.status(500).json({ message: 'Delete error', error: error.message });
    }
};

module.exports = { addProduct, getProducts, getProductByCode, restockProduct, deleteProduct };
