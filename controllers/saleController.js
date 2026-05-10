const { pool } = require('../db');

const addSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Savat bo'sh!" });
        }

        await client.query('BEGIN');
        const savedSales = [];

        for (const item of items) {
            const product_id = parseInt(item.product_id);
            const sell_qty = parseFloat(item.sell_quantity) || 0;
            const sell_area = parseFloat(item.sell_area) || 0;

            console.log(`[SALE] Received: product_id=${product_id}, qty=${sell_qty}, area=${sell_area}`);

            if (!product_id || isNaN(product_id)) {
                throw new Error(`Noto'g'ri mahsulot ID: ${item.product_id}`);
            }

            const productRes = await client.query(
                'SELECT id, name, quantity, total_area, sale_som, sale_usd FROM products WHERE id = $1',
                [product_id]
            );
            if (productRes.rows.length === 0) throw new Error(`Mahsulot (ID: ${product_id}) topilmadi!`);
            
            const product = productRes.rows[0];
            if (sell_qty > product.quantity) throw new Error(`Omborda yetarli mahsulot yo'q: ${product.name}`);

            const t_som = (parseFloat(product.sale_som) || 0) * sell_qty;
            const t_usd = (parseFloat(product.sale_usd) || 0) * sell_qty;

            // Simple update to avoid CASE/COALESCE complexity for now
            await client.query(`
                UPDATE products 
                SET quantity = quantity - $1, 
                    total_area = CASE WHEN total_area IS NULL THEN 0 ELSE total_area - $2 END
                WHERE id = $3
            `, [sell_qty, sell_area, product_id]);

            const saleRes = await client.query(`
                INSERT INTO sales (product_id, quantity, area, som, usd)
                VALUES ($1, $2, $3, $4, $5) RETURNING *
            `, [product_id, sell_qty, sell_area, t_som, t_usd]);

            savedSales.push(saleRes.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json(savedSales);
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("CRITICAL SALE ERROR:", error.message);
        res.status(500).json({ message: error.message || 'Sotuv amalga oshmadi' });
    } finally {
        if (client) client.release();
    }
};

const getSales = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*, p.name as product_name, p.code as product_code, p.image_url 
            FROM sales s 
            JOIN products p ON s.product_id = p.id 
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error });
    }
};

module.exports = { addSale, getSales };
