/**
 * Speed to Lead Calculation Service
 * Calculates the time difference in minutes between lead creation and first contact
 */

/**
 * Calculate speed to lead in minutes
 * @param {Date|string} createdAt - When the lead was created
 * @param {Date|string} contactedAt - When the lead was first contacted
 * @returns {number|null} - Minutes between creation and contact, or null if invalid
 */
function calculateSpeedToLead(createdAt, contactedAt) {
    try {
        // Parse dates if they're strings
        const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
        const contacted = contactedAt instanceof Date ? contactedAt : new Date(contactedAt);

        // Validate dates
        if (isNaN(created.getTime()) || isNaN(contacted.getTime())) {
            console.warn('Invalid date provided to calculateSpeedToLead');
            return null;
        }

        // Ensure contacted is after created
        if (contacted < created) {
            console.warn('Contacted date is before created date');
            return null;
        }

        // Calculate difference in milliseconds, then convert to minutes
        const diffMs = contacted.getTime() - created.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));

        return diffMinutes;
    } catch (error) {
        console.error('Error calculating speed to lead:', error);
        return null;
    }
}

/**
 * Format speed to lead for display
 * @param {number} minutes 
 * @returns {string} - Formatted string (e.g., "2h 30m" or "45m")
 */
function formatSpeedToLead(minutes) {
    if (minutes === null || minutes === undefined) {
        return 'N/A';
    }

    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Categorize speed to lead into performance buckets
 * @param {number} minutes 
 * @returns {string} - Category: 'excellent', 'good', 'fair', 'poor'
 */
function categorizeSpeedToLead(minutes) {
    if (minutes === null || minutes === undefined) {
        return 'unknown';
    }

    if (minutes <= 5) {
        return 'excellent';
    } else if (minutes <= 15) {
        return 'good';
    } else if (minutes <= 60) {
        return 'fair';
    } else {
        return 'poor';
    }
}

module.exports = {
    calculateSpeedToLead,
    formatSpeedToLead,
    categorizeSpeedToLead
};

