const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'speed_to_lead',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:');
        console.error('Error code:', err.code);
        console.error('Error message:', err.message || 'No error message');
        console.error('Full error:', err);
        console.error('\nConnection config:');
        console.error('Host:', process.env.DB_HOST || 'localhost');
        console.error('User:', process.env.DB_USER || 'root');
        console.error('Database:', process.env.DB_NAME || 'speed_to_lead');
        console.error('Port:', process.env.DB_PORT || 3306);
    });

module.exports = pool;

