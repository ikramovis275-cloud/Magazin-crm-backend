const { pool } = require('../db');

const getDailyReports = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                DATE(created_at) as date,
                SUM(som) as total_som,
                SUM(usd) as total_usd,
                SUM(quantity) as total_quantity
            FROM sales
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const totalSalesRes = await pool.query(`
            SELECT 
                SUM(som) as total_som, 
                SUM(usd) as total_usd, 
                SUM(quantity) as total_quantity 
            FROM sales
        `);
        const todaySalesRes = await pool.query(`
            SELECT s.*, p.name as product_name, p.code as product_code 
            FROM sales s 
            JOIN products p ON s.product_id = p.id 
            WHERE DATE(s.created_at) = CURRENT_DATE
        `);
        
        let sumToday_som = 0;
        let sumToday_usd = 0;
        todaySalesRes.rows.forEach(sale => {
            sumToday_som += sale.som;
            sumToday_usd += sale.usd;
        });

        res.json({
            totals: totalSalesRes.rows[0],
            today_sales: todaySalesRes.rows,
            today_sum_som: sumToday_som,
            today_sum_usd: sumToday_usd
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

module.exports = { getDailyReports, getDashboardStats };
