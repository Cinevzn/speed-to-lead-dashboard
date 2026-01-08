# Speed to Lead Tracking System

A comprehensive system for tracking and monitoring speed-to-lead metrics from GoHighLevel webhooks, with a web dashboard for reporting and monitoring appointment setter performance.

## Features

- **Webhook Integration**: Receives lead creation and contact events from GoHighLevel
- **Speed Calculation**: Automatically calculates time between lead creation and first contact
- **Performance Tracking**: Monitor individual appointment setter performance
- **Analytics Dashboard**: Visual charts and reports for speed-to-lead metrics
- **Statistics**: Percentile analysis, trends, and comparative reports

## Architecture

- **Backend**: Node.js/Express REST API
- **Database**: MySQL
- **Frontend**: React dashboard with Recharts

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
cd Solve-Speed-2-Lead
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../dashboard
npm install
```

### 4. Database Setup

Create a MySQL database:

```sql
CREATE DATABASE speed_to_lead;
```

### 5. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=speed_to_lead
DB_PORT=3306
PORT=3000
WEBHOOK_SECRET=
```

### 6. Run Database Migrations

```bash
cd server
npm run migrate
```

This will create all necessary tables:
- `appointment_setters`
- `leads`
- `webhook_logs`

## Running the Application

### Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3000`

### Start the Frontend Dashboard

In a new terminal:

```bash
cd dashboard
npm start
```

The dashboard will open at `http://localhost:3000` (or another port if 3000 is busy)

## API Endpoints

### Webhooks

#### POST `/webhook/lead-created`
Receives webhook from GoHighLevel when a lead is created.

**Expected Payload:**
```json
{
  "lead": {
    "id": "lead_id_123",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "appointmentSetter": {
    "email": "setter@example.com",
    "name": "John Doe"
  }
}
```

**Response:**
```json
{
  "message": "Lead created successfully",
  "lead": { ... }
}
```

#### POST `/webhook/lead-contacted`
Receives webhook from GoHighLevel when a lead is contacted.

**Expected Payload:**
```json
{
  "lead": {
    "id": "lead_id_123",
    "contactedAt": "2024-01-15T11:00:00Z"
  }
}
```

**Response:**
```json
{
  "message": "Lead contact recorded successfully",
  "lead": { ... },
  "speedToLeadMinutes": 30
}
```

### Reports

#### GET `/api/reports/setters`
List all appointment setters with their metrics.

**Response:**
```json
{
  "setters": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "stats": {
        "total_leads": 50,
        "contacted_leads": 45,
        "avg_speed_minutes": 25,
        "min_speed_minutes": 5,
        "max_speed_minutes": 120,
        "contact_rate": 90
      }
    }
  ],
  "count": 1
}
```

#### GET `/api/reports/setters/:id`
Get detailed report for a specific appointment setter.

#### GET `/api/reports/overall`
Get overall speed-to-lead statistics.

#### GET `/api/reports/leads`
List all leads with optional filters.

**Query Parameters:**
- `setter_id` - Filter by appointment setter ID
- `status` - Filter by status (created, contacted, converted)
- `start_date` - Filter leads created after this date
- `end_date` - Filter leads created before this date
- `limit` - Limit number of results (default: 100)

### Statistics

#### GET `/api/stats/average`
Get average speed to lead statistics.

#### GET `/api/stats/percentiles`
Get percentile breakdown (p50, p75, p90, p95).

#### GET `/api/stats/trends`
Get speed to lead trends over time.

**Query Parameters:**
- `period` - Time period: `day`, `week`, or `month` (default: `day`)

#### GET `/api/stats/by-setter`
Get statistics grouped by appointment setter.

## GoHighLevel Webhook Configuration

### Setting Up Webhooks in GoHighLevel

1. Log into your GoHighLevel account
2. Navigate to Settings > Integrations > Webhooks
3. Create a new webhook for "Lead Created" event
4. Set the webhook URL to: `https://your-domain.com/webhook/lead-created`
5. Create another webhook for "Lead Contacted" event
6. Set the webhook URL to: `https://your-domain.com/webhook/lead-contacted`

### Webhook Payload Structure

The system expects the following payload structure. You may need to adjust the webhook endpoints (`server/src/routes/webhooks.js`) to match your actual GoHighLevel webhook format.

**Lead Created:**
- `lead.id` or `leadId` - Unique lead identifier
- `lead.createdAt` or `createdAt` - ISO timestamp of lead creation
- `appointmentSetter.email` or `setter.email` - Email of appointment setter
- `appointmentSetter.name` or `setter.name` - Name of appointment setter

**Lead Contacted:**
- `lead.id` or `leadId` - Unique lead identifier
- `lead.contactedAt` or `contactedAt` - ISO timestamp of first contact

### Testing Webhooks Locally

For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL in your GoHighLevel webhook configuration.

## Dashboard Features

### Main Dashboard
- Overview statistics (total leads, contacted leads, average speed)
- Speed to lead trends chart
- Recent leads table

### Overall Stats
- Comprehensive statistics
- Percentile analysis (50th, 75th, 90th, 95th)
- Trends over time (daily, weekly, monthly)

### Setter Reports
- Performance comparison across all setters
- Individual setter details
- Recent leads per setter

## Database Schema

### appointment_setters
- `id` - Primary key
- `name` - Setter name
- `email` - Setter email (unique)
- `created_at` - Record creation timestamp

### leads
- `id` - Primary key
- `ghl_lead_id` - GoHighLevel lead ID (unique)
- `appointment_setter_id` - Foreign key to appointment_setters
- `created_at` - When lead was created in GHL
- `first_contacted_at` - When first contact was made
- `speed_to_lead_minutes` - Calculated minutes between creation and contact
- `status` - Lead status (created, contacted, converted)
- `metadata` - Additional GHL data (JSON)
- `system_created_at` - When record was created in our system

### webhook_logs
- `id` - Primary key
- `endpoint` - Webhook endpoint
- `payload` - Webhook payload (JSON)
- `processed` - Whether webhook was processed successfully
- `error` - Error message if processing failed
- `created_at` - Timestamp

## Development

### Running in Development Mode

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd dashboard
npm start
```

### Database Migrations

To run migrations:
```bash
cd server
npm run migrate
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file has correct database credentials
- Ensure database exists: `CREATE DATABASE speed_to_lead;`

### Webhook Not Processing
- Check `webhook_logs` table for error messages
- Verify webhook payload structure matches expected format
- Check server logs for detailed error messages

### Dashboard Not Loading Data
- Verify backend server is running on port 3000
- Check browser console for API errors
- Verify CORS is enabled (should be enabled by default)

## License

ISC

## Support

For issues or questions, please check the webhook logs table or server console for detailed error messages.

