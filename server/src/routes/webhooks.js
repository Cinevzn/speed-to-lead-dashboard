const express = require('express');
const router = express.Router();
const AppointmentSetter = require('../models/AppointmentSetter');
const Lead = require('../models/Lead');
const WebhookLog = require('../models/WebhookLog');
const { calculateSpeedToLead } = require('../services/speedToLead');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /webhook/lead-created
 * Receives webhook from GoHighLevel when a lead is created
 * Expected payload structure (example):
 * {
 *   "lead": {
 *     "id": "lead_id_123",
 *     "createdAt": "2024-01-15T10:30:00Z",
 *     ...
 *   },
 *   "appointmentSetter": {
 *     "email": "setter@example.com",
 *     "name": "John Doe"
 *   }
 * }
 */
router.post('/lead-created', asyncHandler(async (req, res) => {
    const payload = req.body;
    let webhookLog;

    try {
        // Capture server timestamp when webhook is received
        const serverReceivedAt = new Date();
        
        // Log webhook
        webhookLog = await WebhookLog.create('/webhook/lead-created', payload);

        // Extract data from payload (adjust based on actual GHL webhook structure)
        const leadId = payload.lead?.id || payload.leadId || payload.id;
        
        // Use timestamp from payload if provided, otherwise use server timestamp
        const payloadCreatedAt = payload.lead?.createdAt || payload.createdAt || payload.timestamp;
        const createdAt = payloadCreatedAt ? new Date(payloadCreatedAt) : serverReceivedAt;
        
        // Log which timestamp was used for debugging
        if (!payloadCreatedAt) {
            console.log(`[Lead Created] No timestamp in payload for lead ${leadId}, using server timestamp: ${serverReceivedAt.toISOString()}`);
        }
        
        const setterEmail = payload.appointmentSetter?.email || payload.setter?.email || payload.email;
        const setterName = payload.appointmentSetter?.name || payload.setter?.name || payload.name || setterEmail;

        // Validate required fields
        if (!leadId) {
            throw new Error('Missing required field: lead ID');
        }

        // Handle NULL setter - set status to unassigned
        let setter = null;
        let leadStatus = 'created';
        
        if (!setterEmail) {
            // No setter provided - mark as unassigned
            leadStatus = 'unassigned';
            console.log(`[Lead Created] No setter provided for lead ${leadId}, marking as unassigned`);
        } else {
            // Find or create appointment setter
            setter = await AppointmentSetter.findOrCreate(setterEmail, setterName);
        }

        // Check if lead already exists
        const existingLead = await Lead.findByGhlLeadId(leadId);
        if (existingLead) {
            await WebhookLog.markProcessed(webhookLog.id);
            return res.status(200).json({
                message: 'Lead already exists',
                lead: existingLead
            });
        }

        // Create lead record with enhanced metadata including server timestamp
        const enhancedMetadata = {
            ...payload,
            _server: {
                webhookReceivedAt: serverReceivedAt.toISOString(),
                timestampSource: payloadCreatedAt ? 'payload' : 'server',
                payloadTimestamp: payloadCreatedAt || null
            }
        };
        
        const lead = await Lead.create({
            ghl_lead_id: leadId,
            appointment_setter_id: setter ? setter.id : null,
            created_at: createdAt,
            status: leadStatus,
            metadata: enhancedMetadata
        });

        await WebhookLog.markProcessed(webhookLog.id);

        res.status(201).json({
            message: 'Lead created successfully',
            lead: lead
        });
    } catch (error) {
        console.error('Error processing lead-created webhook:', error);
        
        if (webhookLog) {
            await WebhookLog.markFailed(webhookLog.id, error.message);
        }

        res.status(400).json({
            error: {
                message: 'Failed to process webhook',
                details: error.message
            }
        });
    }
}));

/**
 * POST /webhook/lead-contacted
 * Receives webhook from GoHighLevel when a lead is contacted
 * Expected payload structure (example):
 * {
 *   "lead": {
 *     "id": "lead_id_123",
 *     "contactedAt": "2024-01-15T11:00:00Z",
 *     ...
 *   }
 * }
 */
router.post('/lead-contacted', asyncHandler(async (req, res) => {
    const payload = req.body;
    let webhookLog;

    try {
        // Capture server timestamp when webhook is received
        const serverReceivedAt = new Date();
        
        // Log webhook
        webhookLog = await WebhookLog.create('/webhook/lead-contacted', payload);

        // Extract data from payload
        const leadId = payload.lead?.id || payload.leadId || payload.id;
        
        // Use timestamp from payload if provided, otherwise use server timestamp
        const payloadContactedAt = payload.lead?.contactedAt || payload.contactedAt || payload.timestamp;
        const contactedAt = payloadContactedAt ? new Date(payloadContactedAt) : serverReceivedAt;
        
        // Log which timestamp was used for debugging
        if (!payloadContactedAt) {
            console.log(`[Lead Contacted] No timestamp in payload for lead ${leadId}, using server timestamp: ${serverReceivedAt.toISOString()}`);
        }

        // Validate required fields
        if (!leadId) {
            throw new Error('Missing required field: lead ID');
        }

        // Find lead
        const lead = await Lead.findByGhlLeadId(leadId);
        if (!lead) {
            throw new Error(`Lead not found: ${leadId}`);
        }

        // Check if already contacted
        if (lead.first_contacted_at) {
            await WebhookLog.markProcessed(webhookLog.id);
            return res.status(200).json({
                message: 'Lead already marked as contacted',
                lead: lead
            });
        }

        // Calculate speed to lead
        const speedToLeadMinutes = calculateSpeedToLead(lead.created_at, contactedAt);
        
        // Log timestamp information for debugging
        console.log(`[Lead Contacted] Lead ${leadId}: Created at ${lead.created_at}, Contacted at ${contactedAt.toISOString()}, Speed: ${speedToLeadMinutes} minutes`);

        // Update lead with contact information
        const updatedLead = await Lead.updateContact(
            leadId,
            contactedAt,
            speedToLeadMinutes
        );

        await WebhookLog.markProcessed(webhookLog.id);

        res.status(200).json({
            message: 'Lead contact recorded successfully',
            lead: updatedLead,
            speedToLeadMinutes: speedToLeadMinutes
        });
    } catch (error) {
        console.error('Error processing lead-contacted webhook:', error);
        
        if (webhookLog) {
            await WebhookLog.markFailed(webhookLog.id, error.message);
        }

        res.status(400).json({
            error: {
                message: 'Failed to process webhook',
                details: error.message
            }
        });
    }
}));

module.exports = router;

