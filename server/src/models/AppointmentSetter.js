const db = require('../config/database');

class AppointmentSetter {
    /**
     * Find or create an appointment setter by email
     * @param {string} email 
     * @param {string} name 
     * @returns {Promise<Object>}
     */
    static async findOrCreate(email, name) {
        try {
            // Try to find existing setter
            const [existing] = await db.execute(
                'SELECT * FROM appointment_setters WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                // Update name if provided and different
                if (name && existing[0].name !== name) {
                    await db.execute(
                        'UPDATE appointment_setters SET name = ? WHERE id = ?',
                        [name, existing[0].id]
                    );
                    existing[0].name = name;
                }
                return existing[0];
            }

            // Create new setter
            const [result] = await db.execute(
                'INSERT INTO appointment_setters (email, name) VALUES (?, ?)',
                [email, name || email]
            );

            const [newSetter] = await db.execute(
                'SELECT * FROM appointment_setters WHERE id = ?',
                [result.insertId]
            );

            return newSetter[0];
        } catch (error) {
            console.error('Error in AppointmentSetter.findOrCreate:', error);
            throw error;
        }
    }

    /**
     * Get all appointment setters
     * @returns {Promise<Array>}
     */
    static async findAll() {
        try {
            const [setters] = await db.execute(
                'SELECT * FROM appointment_setters ORDER BY name ASC'
            );
            return setters;
        } catch (error) {
            console.error('Error in AppointmentSetter.findAll:', error);
            throw error;
        }
    }

    /**
     * Get appointment setter by ID
     * @param {number} id 
     * @returns {Promise<Object|null>}
     */
    static async findById(id) {
        try {
            const [setters] = await db.execute(
                'SELECT * FROM appointment_setters WHERE id = ?',
                [id]
            );
            return setters.length > 0 ? setters[0] : null;
        } catch (error) {
            console.error('Error in AppointmentSetter.findById:', error);
            throw error;
        }
    }

    /**
     * Get appointment setter by email
     * @param {string} email 
     * @returns {Promise<Object|null>}
     */
    static async findByEmail(email) {
        try {
            const [setters] = await db.execute(
                'SELECT * FROM appointment_setters WHERE email = ?',
                [email]
            );
            return setters.length > 0 ? setters[0] : null;
        } catch (error) {
            console.error('Error in AppointmentSetter.findByEmail:', error);
            throw error;
        }
    }
}

module.exports = AppointmentSetter;

