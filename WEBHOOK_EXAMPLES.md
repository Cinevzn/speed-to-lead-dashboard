# GoHighLevel Webhook Payload Examples

This document shows example webhook payloads that the system expects. You may need to adjust the webhook handlers in `server/src/routes/webhooks.js` to match your actual GoHighLevel webhook format.

## Lead Created Webhook

**Endpoint:** `POST /webhook/lead-created`

**Example Payload:**
```json
{
  "lead": {
    "id": "lead_abc123",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "appointmentSetter": {
    "email": "setter@example.com",
    "name": "John Doe"
  }
}
```

**Alternative Format (if GHL uses different structure):**
```json
{
  "leadId": "lead_abc123",
  "createdAt": "2024-01-15T10:30:00Z",
  "setter": {
    "email": "setter@example.com",
    "name": "John Doe"
  }
}
```

## Lead Contacted Webhook

**Endpoint:** `POST /webhook/lead-contacted`

**Example Payload:**
```json
{
  "lead": {
    "id": "lead_abc123",
    "contactedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Alternative Format:**
```json
{
  "leadId": "lead_abc123",
  "contactedAt": "2024-01-15T11:00:00Z",
  "timestamp": "2024-01-15T11:00:00Z"
}
```

## Adjusting Webhook Handlers

If your GoHighLevel webhooks use a different structure, edit `server/src/routes/webhooks.js` and update the data extraction logic:

```javascript
// Current extraction (adjust as needed):
const leadId = payload.lead?.id || payload.leadId || payload.id;
const createdAt = payload.lead?.createdAt || payload.createdAt || payload.timestamp;
const setterEmail = payload.appointmentSetter?.email || payload.setter?.email || payload.email;
```

## Testing Webhooks

You can test webhooks locally using curl:

```bash
# Test lead created
curl -X POST http://localhost:3000/webhook/lead-created \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "id": "test_lead_123",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "appointmentSetter": {
      "email": "test@example.com",
      "name": "Test Setter"
    }
  }'

# Test lead contacted
curl -X POST http://localhost:3000/webhook/lead-contacted \
  -H "Content-Type: application/json" \
  -d '{
    "lead": {
      "id": "test_lead_123",
      "contactedAt": "2024-01-15T11:00:00Z"
    }
  }'
```

## Checking Webhook Logs

All webhooks are logged in the `webhook_logs` table. You can query this table to see:
- All received webhooks
- Processing status
- Error messages if processing failed

```sql
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
```

