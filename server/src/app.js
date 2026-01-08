const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const webhookRoutes = require('./routes/webhooks');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Root route - API information
app.get('/', (req, res) => {
    res.json({ 
        service: 'Speed to Lead Tracking API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            webhooks: {
                leadCreated: '/webhook/lead-created',
                leadContacted: '/webhook/lead-contacted'
            },
            reports: '/api/reports',
            stats: '/api/stats'
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/webhook', webhookRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server - IMPORTANT: Bind to 0.0.0.0 for cPanel
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Webhook endpoints:`);
    console.log(`  POST http://localhost:${PORT}/webhook/lead-created`);
    console.log(`  POST http://localhost:${PORT}/webhook/lead-contacted`);
});

module.exports = app;

