const db = require('../config/database');

class Lead {
    /**
     * Create a new lead
     * @param {Object} leadData 
     * @returns {Promise<Object>}
     */
    static async create(leadData) {
        try {
            const {
                ghl_lead_id,
                appointment_setter_id,
                created_at,
                status = 'created',
                metadata = null
            } = leadData;

            const [result] = await db.execute(
                `INSERT INTO leads 
                (ghl_lead_id, appointment_setter_id, created_at, status, metadata) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    ghl_lead_id,
                    appointment_setter_id,
                    created_at,
                    status,
                    metadata ? JSON.stringify(metadata) : null
                ]
            );

            return await this.findById(result.insertId);
        } catch (error) {
            console.error('Error in Lead.create:', error);
            throw error;
        }
    }

    /**
     * Find lead by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const [leads] = await db.execute(
                'SELECT * FROM leads WHERE id = ?',
                [id]
            );
            if (leads.length === 0) return null;
            return this._parseLead(leads[0]);
        } catch (error) {
            console.error('Error in Lead.findById:', error);
            throw error;
        }
    }

    /**
     * Find lead by GHL lead ID
     * @param {string} ghlLeadId 
     * @returns {Promise<Object|null>}
     */
    static async findByGhlLeadId(ghlLeadId) {
        try {
            const [leads] = await db.execute(
                'SELECT * FROM leads WHERE ghl_lead_id = ?',
                [ghlLeadId]
            );
            if (leads.length === 0) return null;
            return this._parseLead(leads[0]);
        } catch (error) {
            console.error('Error in Lead.findByGhlLeadId:', error);
            throw error;
        }
    }

    /**
     * Update lead when contacted
     * @param {string} ghlLeadId 
     * @param {Date} contactedAt 
     * @param {number} speedToLeadMinutes 
     * @returns {Promise<Object>}
     */
    static async updateContact(ghlLeadId, contactedAt, speedToLeadMinutes) {
        try {
            await db.execute(
                `UPDATE leads 
                SET first_contacted_at = ?, 
                    speed_to_lead_minutes = ?, 
                    status = 'contacted' 
                WHERE ghl_lead_id = ?`,
                [contactedAt, speedToLeadMinutes, ghlLeadId]
            );

            return await this.findByGhlLeadId(ghlLeadId);
        } catch (error) {
            console.error('Error in Lead.updateContact:', error);
            throw error;
        }
    }

    /**
     * Get all leads with optional filters
     * @param {Object} filters 
     * @returns {Promise<Array>}
     */
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT l.*, a.name as setter_name, a.email as setter_email 
                FROM leads l
                JOIN appointment_setters a ON l.appointment_setter_id = a.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.appointment_setter_id) {
                query += ' AND l.appointment_setter_id = ?';
                params.push(filters.appointment_setter_id);
            }

            if (filters.status) {
                query += ' AND l.status = ?';
                params.push(filters.status);
            }

            if (filters.start_date) {
                query += ' AND l.created_at >= ?';
                params.push(filters.start_date);
            }

            if (filters.end_date) {
                query += ' AND l.created_at <= ?';
                params.push(filters.end_date);
            }

            query += ' ORDER BY l.created_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            const [leads] = await db.execute(query, params);
            return leads.map(lead => this._parseLead(lead));
        } catch (error) {
            console.error('Error in Lead.findAll:', error);
            throw error;
        }
    }

    /**
     * Get leads statistics by setter
     * @param {number} setterId 
     * @returns {Promise<Object>}
     */
    static async getStatsBySetter(setterId) {
        try {
            const [stats] = await db.execute(
                `SELECT 
                    COUNT(*) as total_leads,
                    COUNT(first_contacted_at) as contacted_leads,
                    AVG(speed_to_lead_minutes) as avg_speed_minutes,
                    MIN(speed_to_lead_minutes) as min_speed_minutes,
                    MAX(speed_to_lead_minutes) as max_speed_minutes
                FROM leads 
                WHERE appointment_setter_id = ?`,
                [setterId]
            );

            return stats[0];
        } catch (error) {
            console.error('Error in Lead.getStatsBySetter:', error);
            throw error;
        }
    }

    /**
     * Get overall statistics
     * @returns {Promise<Object>}
     */
    static async getOverallStats() {
        try {
            const [stats] = await db.execute(
                `SELECT 
                    COUNT(*) as total_leads,
                    COUNT(first_contacted_at) as contacted_leads,
                    AVG(speed_to_lead_minutes) as avg_speed_minutes,
                    MIN(speed_to_lead_minutes) as min_speed_minutes,
                    MAX(speed_to_lead_minutes) as max_speed_minutes
                FROM leads 
                WHERE speed_to_lead_minutes IS NOT NULL`
            );

            return stats[0];
        } catch (error) {
            console.error('Error in Lead.getOverallStats:', error);
            throw error;
        }
    }

    /**
     * Get percentile statistics
     * @returns {Promise<Object>}
     */
    static async getPercentiles() {
        try {
            // MySQL/MariaDB doesn't support PERCENTILE_CONT, so we calculate manually
            const [allSpeeds] = await db.execute(
                `SELECT speed_to_lead_minutes 
                FROM leads 
                WHERE speed_to_lead_minutes IS NOT NULL 
                ORDER BY speed_to_lead_minutes`
            );

            const speeds = allSpeeds.map(r => r.speed_to_lead_minutes);
            if (speeds.length === 0) {
                return { p50: null, p75: null, p90: null, p95: null };
            }

            return {
                p50: this._getPercentile(speeds, 50),
                p75: this._getPercentile(speeds, 75),
                p90: this._getPercentile(speeds, 90),
                p95: this._getPercentile(speeds, 95)
            };
        } catch (error) {
            console.error('Error in Lead.getPercentiles:', error);
            throw error;
        }
    }

    /**
     * Get trends over time
     * @param {string} period - 'day', 'week', 'month'
     * @returns {Promise<Array>}
     */
    static async getTrends(period = 'day') {
        try {
            let dateFormat;
            switch (period) {
                case 'day':
                    dateFormat = '%Y-%m-%d';
                    break;
                case 'week':
                    dateFormat = '%Y-%u';
                    break;
                case 'month':
                    dateFormat = '%Y-%m';
                    break;
                default:
                    dateFormat = '%Y-%m-%d';
            }

            const [trends] = await db.execute(
                `SELECT 
                    DATE_FORMAT(created_at, ?) as period,
                    COUNT(*) as total_leads,
                    COUNT(first_contacted_at) as contacted_leads,
                    AVG(speed_to_lead_minutes) as avg_speed_minutes
                FROM leads
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY period
                ORDER BY period ASC`,
                [dateFormat]
            );

            return trends;
        } catch (error) {
            console.error('Error in Lead.getTrends:', error);
            throw error;
        }
    }

    /**
     * Get average time of day when leads are created
     * @returns {Promise<Object>}
     */
    static async getAverageTimeOfDay() {
        try {
            // Get average hour and minute of day
            const [result] = await db.execute(
                `SELECT 
                    AVG(HOUR(created_at)) as avg_hour,
                    AVG(MINUTE(created_at)) as avg_minute,
                    COUNT(*) as total_leads
                FROM leads`
            );

            if (!result[0] || result[0].total_leads === 0) {
                return {
                    average_time: null,
                    average_hour: null,
                    average_minute: null,
                    formatted_time: 'N/A',
                    total_leads: 0
                };
            }

            const avgHour = Math.round(result[0].avg_hour);
            const avgMinute = Math.round(result[0].avg_minute);
            
            // Format time
            const hour12 = avgHour % 12 || 12;
            const ampm = avgHour >= 12 ? 'PM' : 'AM';
            const formattedTime = `${hour12}:${avgMinute.toString().padStart(2, '0')} ${ampm}`;

            return {
                average_time: `${avgHour}:${avgMinute.toString().padStart(2, '0')}`,
                average_hour: avgHour,
                average_minute: avgMinute,
                formatted_time: formattedTime,
                total_leads: parseInt(result[0].total_leads) || 0
            };
        } catch (error) {
            console.error('Error in Lead.getAverageTimeOfDay:', error);
            throw error;
        }
    }

    /**
     * Parse lead data (handle JSON metadata)
     * @private
     */
    static _parseLead(lead) {
        if (lead.metadata && typeof lead.metadata === 'string') {
            try {
                lead.metadata = JSON.parse(lead.metadata);
            } catch (e) {
                // Keep as string if parsing fails
            }
        }
        return lead;
    }

    /**
     * Calculate percentile from sorted array
     * @private
     */
    static _getPercentile(sortedArray, percentile) {
        const index = (percentile / 100) * (sortedArray.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        return Math.round(sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight);
    }
}

module.exports = Lead;

