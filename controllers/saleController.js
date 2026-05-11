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
            const custom_som = parseFloat(item.sale_som);
            const custom_usd = parseFloat(item.sale_usd);

            console.log(`[SALE] Received: product_id=${product_id}, qty=${sell_qty}, area=${sell_area}, price_usd=${custom_usd}`);

            if (!product_id || isNaN(product_id)) {
                throw new Error(`Noto'g'ri mahsulot ID: ${item.product_id}`);
            }

            const productRes = await client.query(
                'SELECT id, name, quantity, total_area, sale_som, sale_usd FROM magazin_products WHERE id = $1',
                [product_id]
            );
            if (productRes.rows.length === 0) throw new Error(`Mahsulot (ID: ${product_id}) topilmadi!`);
            
            const product = productRes.rows[0];
            if (sell_qty > product.quantity) throw new Error(`Omborda yetarli mahsulot yo'q: ${product.name}`);

            // Use custom price if provided, otherwise use product price
            const price_som = !isNaN(custom_som) ? custom_som : (parseFloat(product.sale_som) || 0);
            const price_usd = !isNaN(custom_usd) ? custom_usd : (parseFloat(product.sale_usd) || 0);

            const t_som = price_som * sell_qty;
            const t_usd = price_usd * sell_qty;

            await client.query(`
                UPDATE magazin_products 
                SET quantity = quantity - $1, 
                    total_area = CASE WHEN total_area IS NULL THEN 0 ELSE total_area - $2 END
                WHERE id = $3
            `, [sell_qty, sell_area, product_id]);

            const saleRes = await client.query(`
                INSERT INTO magazin_sales (product_id, quantity, area, som, usd)
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
            FROM magazin_sales s 
            JOIN magazin_products p ON s.product_id = p.id 
            ORDER BY s.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error });
    }
};

const returnSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { return_quantity } = req.body;
        
        const returnQty = parseFloat(return_quantity);
        if (isNaN(returnQty) || returnQty <= 0) {
            return res.status(400).json({ message: "Noto'g'ri qaytarish miqdori!" });
        }

        await client.query('BEGIN');

        // 1. Get current sale info
        const saleRes = await client.query('SELECT * FROM magazin_sales WHERE id = $1', [id]);
        if (saleRes.rows.length === 0) {
            throw new Error("Sotuv topilmadi!");
        }
        const sale = saleRes.rows[0];

        if (returnQty > sale.quantity) {
            throw new Error("Qaytarish miqdori sotilgan miqdordan ko'p!");
        }

        // Calculate proportions for area and prices if needed, 
        // but user said just subtract from quantity and add to warehouse.
        // We also need to update total price (som, usd) proportionally.
        const unit_som = sale.som / sale.quantity;
        const unit_usd = sale.usd / sale.quantity;
        const unit_area = sale.area / sale.quantity;

        const returnSom = unit_som * returnQty;
        const returnUsd = unit_usd * returnQty;
        const returnArea = unit_area * returnQty;

        // 2. Update product quantity (return to warehouse)
        await client.query(`
            UPDATE magazin_products 
            SET quantity = quantity + $1,
                total_area = COALESCE(total_area, 0) + $2
            WHERE id = $3
        `, [returnQty, returnArea, sale.product_id]);

        console.log(`[RETURN] Product ID: ${sale.product_id}, Return Qty: ${returnQty}, Return Area: ${returnArea}`);

        // 3. Update or delete the sale
        if (returnQty === sale.quantity) {
            // Full return, delete sale record
            await client.query('DELETE FROM magazin_sales WHERE id = $1', [id]);
            console.log(`[RETURN] Full return for sale ID: ${id}. Record deleted.`);
        } else {
            // Partial return, update sale record
            await client.query(`
                UPDATE magazin_sales 
                SET quantity = quantity - $1,
                    area = area - $2,
                    som = som - $3,
                    usd = usd - $4
                WHERE id = $5
            `, [returnQty, returnArea, returnSom, returnUsd, id]);
            console.log(`[RETURN] Partial return for sale ID: ${id}. Updated quantity and totals.`);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Mahsulot muvaffaqiyatli qaytarildi" });
    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("RETURN ERROR:", error.message);
        res.status(500).json({ message: error.message || 'Qaytarishda xatolik' });
    } finally {
        if (client) client.release();
    }
};

module.exports = { addSale, getSales, returnSale };
