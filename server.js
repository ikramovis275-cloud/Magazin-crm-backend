const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDB } = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'CRM API',
            version: '1.0.0',
            description: 'API documentation for the CRM system'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`
            }
        ]
    },
    apis: ['./routes/*.js']
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Initialize DB
initDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5000;

// Simple ping endpoint to check if server is alive
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    
    // Auto-ping to prevent Render from sleeping
    const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(() => {
        const http = url.startsWith('https') ? require('https') : require('http');
        http.get(`${url}/ping`, (res) => {
            console.log(`[Self-Ping] Waking up the server - Status: ${res.statusCode}`);
        }).on('error', (err) => {
            console.error(`[Self-Ping Error]: ${err.message}`);
        });
    }, 2 * 60 * 1000); // 2 minutes (har 2 minutda, 2 sekund qilsa Render bloklaydi)
});
