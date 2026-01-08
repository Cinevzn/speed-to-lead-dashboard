const express = require('express');
const router = express.Router();
const AppointmentSetter = require('../models/AppointmentSetter');
const Lead = require('../models/Lead');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/reports/setters
 * List all setters with their metrics
 */
router.get('/setters', asyncHandler(async (req, res) => {
    const setters = await AppointmentSetter.findAll();
    
    // Get stats for each setter
    const settersWithStats = await Promise.all(
        setters.map(async (setter) => {
            const stats = await Lead.getStatsBySetter(setter.id);
            return {
                ...setter,
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

    res.json({
        setters: settersWithStats,
        count: settersWithStats.length
    });
}));

/**
 * GET /api/reports/setters/:id
 * Detailed report for specific setter
 */
router.get('/setters/:id', asyncHandler(async (req, res) => {
    const setterId = parseInt(req.params.id);
    
    const setter = await AppointmentSetter.findById(setterId);
    if (!setter) {
        return res.status(404).json({
            error: {
                message: 'Appointment setter not found',
                status: 404
            }
        });
    }

    const stats = await Lead.getStatsBySetter(setterId);
    const leads = await Lead.findAll({ 
        appointment_setter_id: setterId,
        limit: 100 
    });

    res.json({
        setter: setter,
        stats: {
            total_leads: parseInt(stats.total_leads) || 0,
            contacted_leads: parseInt(stats.contacted_leads) || 0,
            avg_speed_minutes: stats.avg_speed_minutes ? Math.round(stats.avg_speed_minutes) : null,
            min_speed_minutes: stats.min_speed_minutes || null,
            max_speed_minutes: stats.max_speed_minutes || null,
            contact_rate: stats.total_leads > 0 
                ? Math.round((stats.contacted_leads / stats.total_leads) * 100) 
                : 0
        },
        recent_leads: leads
    });
}));

/**
 * GET /api/reports/overall
 * Overall speed-to-lead statistics
 */
router.get('/overall', asyncHandler(async (req, res) => {
    const stats = await Lead.getOverallStats();
    const setters = await AppointmentSetter.findAll();
    
    // Get total leads count (including non-contacted)
    const allLeads = await Lead.findAll();
    
    res.json({
        stats: {
            total_leads: allLeads.length,
            contacted_leads: parseInt(stats.contacted_leads) || 0,
            avg_speed_minutes: stats.avg_speed_minutes ? Math.round(stats.avg_speed_minutes) : null,
            min_speed_minutes: stats.min_speed_minutes || null,
            max_speed_minutes: stats.max_speed_minutes || null,
            contact_rate: allLeads.length > 0 
                ? Math.round((stats.contacted_leads / allLeads.length) * 100) 
                : 0
        },
        total_setters: setters.length
    });
}));

/**
 * GET /api/reports/leads
 * List all leads with speed-to-lead data
 * Query params: setter_id, status, start_date, end_date, limit
 */
router.get('/leads', asyncHandler(async (req, res) => {
    const filters = {};
    
    if (req.query.setter_id) {
        filters.appointment_setter_id = parseInt(req.query.setter_id);
    }
    
    if (req.query.status) {
        filters.status = req.query.status;
    }
    
    if (req.query.start_date) {
        filters.start_date = req.query.start_date;
    }
    
    if (req.query.end_date) {
        filters.end_date = req.query.end_date;
    }
    
    if (req.query.limit) {
        filters.limit = parseInt(req.query.limit);
    } else {
        filters.limit = 100; // Default limit
    }

    const leads = await Lead.findAll(filters);

    res.json({
        leads: leads,
        count: leads.length,
        filters: filters
    });
}));

module.exports = router;

