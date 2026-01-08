const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const AppointmentSetter = require('../models/AppointmentSetter');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/stats/average
 * Average speed to lead
 */
router.get('/average', asyncHandler(async (req, res) => {
    const stats = await Lead.getOverallStats();
    
    res.json({
        average_speed_minutes: stats.avg_speed_minutes ? Math.round(stats.avg_speed_minutes) : null,
        min_speed_minutes: stats.min_speed_minutes || null,
        max_speed_minutes: stats.max_speed_minutes || null,
        total_contacted: parseInt(stats.contacted_leads) || 0
    });
}));

/**
 * GET /api/stats/percentiles
 * Percentile breakdown (p50, p75, p90, p95)
 */
router.get('/percentiles', asyncHandler(async (req, res) => {
    const percentiles = await Lead.getPercentiles();
    
    res.json({
        percentiles: {
            p50: percentiles.p50,
            p75: percentiles.p75,
            p90: percentiles.p90,
            p95: percentiles.p95
        }
    });
}));

/**
 * GET /api/stats/trends
 * Speed to lead trends over time
 * Query params: period (day, week, month) - default: day
 */
router.get('/trends', asyncHandler(async (req, res) => {
    const period = req.query.period || 'day';
    
    if (!['day', 'week', 'month'].includes(period)) {
        return res.status(400).json({
            error: {
                message: 'Invalid period',
                details: 'Period must be one of: day, week, month'
            }
        });
    }

    const trends = await Lead.getTrends(period);
    
    res.json({
        period: period,
        trends: trends
    });
}));

/**
 * GET /api/stats/time-of-day
 * Average time of day when leads are created
 */
router.get('/time-of-day', asyncHandler(async (req, res) => {
    const timeOfDay = await Lead.getAverageTimeOfDay();
    
    res.json({
        time_of_day: timeOfDay
    });
}));

/**
 * GET /api/stats/by-setter
 * Statistics grouped by setter
 */
router.get('/by-setter', asyncHandler(async (req, res) => {
    const setters = await AppointmentSetter.findAll();
    
    const statsBySetter = await Promise.all(
        setters.map(async (setter) => {
            const stats = await Lead.getStatsBySetter(setter.id);
            return {
                setter_id: setter.id,
                setter_name: setter.name,
                setter_email: setter.email,
                stats: {
                    total_leads: parseInt(stats.total_leads) || 0,
                    contacted_leads: parseInt(stats.contacted_leads) || 0,
                    avg_speed_minutes: stats.avg_speed_minutes ? Math.round(stats.avg_speed_minutes) : null,
                    min_speed_minutes: stats.min_speed_minutes || null,
                    max_speed_minutes: stats.max_speed_minutes || null,
                    contact_rate: stats.total_leads > 0 
                        ? Math.round((stats.contacted_leads / stats.total_leads) * 100) 
                        : 0
                }
            };
        })
    );

    // Sort by average speed (ascending - fastest first)
    statsBySetter.sort((a, b) => {
        const aSpeed = a.stats.avg_speed_minutes || Infinity;
        const bSpeed = b.stats.avg_speed_minutes || Infinity;
        return aSpeed - bSpeed;
    });

    res.json({
        stats_by_setter: statsBySetter,
        count: statsBySetter.length
    });
}));

module.exports = router;

