const db = require('../config/database');

class WebhookLog {
    /**
     * Log a webhook request
     * @param {string} endpoint 
     * @param {Object} payload 
     * @returns {Promise<Object>}
     */
    static async create(endpoint, payload) {
        try {
            const [result] = await db.execute(
                'INSERT INTO webhook_logs (endpoint, payload) VALUES (?, ?)',
                [endpoint, JSON.stringify(payload)]
            );

            const [log] = await db.execute(
                'SELECT * FROM webhook_logs WHERE id = ?',
                [result.insertId]
            );

            return log[0];
        } catch (error) {
            console.error('Error in WebhookLog.create:', error);
            throw error;
        }
    }

    /**
     * Mark webhook log as processed
     * @param {number} id 
     * @returns {Promise<void>}
     */
    static async markProcessed(id) {
        try {
            await db.execute(
                'UPDATE webhook_logs SET processed = TRUE WHERE id = ?',
                [id]
            );
        } catch (error) {
            console.error('Error in WebhookLog.markProcessed:', error);
            throw error;
        }
    }

    /**
     * Mark webhook log as failed
     * @param {number} id 
     * @param {string} error 
     * @returns {Promise<void>}
     */
    static async markFailed(id, error) {
        try {
            await db.execute(
                'UPDATE webhook_logs SET processed = TRUE, error = ? WHERE id = ?',
                [error, id]
            );
        } catch (error) {
            console.error('Error in WebhookLog.markFailed:', error);
            throw error;
        }
    }

    /**
     * Get all webhook logs
     * @param {Object} filters 
     * @returns {Promise<Array>}
     */
    static async findAll(filters = {}) {
        try {
            let query = 'SELECT * FROM webhook_logs WHERE 1=1';
            const params = [];

            if (filters.endpoint) {
                query += ' AND endpoint = ?';
                params.push(filters.endpoint);
            }

            if (filters.processed !== undefined) {
                query += ' AND processed = ?';
                params.push(filters.processed);
            }

            query += ' ORDER BY created_at DESC LIMIT 100';

            const [logs] = await db.execute(query, params);
            return logs.map(log => {
                if (log.payload && typeof log.payload === 'string') {
                    try {
                        log.payload = JSON.parse(log.payload);
                    } catch (e) {
                        // Keep as string if parsing fails
                    }
                }
                return log;
            });
        } catch (error) {
            console.error('Error in WebhookLog.findAll:', error);
            throw error;
        }
    }
}

module.exports = WebhookLog;

