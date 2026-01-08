-- Create database (run this manually if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS speed_to_lead;
-- USE speed_to_lead;

-- Appointment Setters Table
CREATE TABLE IF NOT EXISTS appointment_setters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ghl_lead_id VARCHAR(255) UNIQUE NOT NULL,
    appointment_setter_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL COMMENT 'When lead was created in GHL',
    first_contacted_at TIMESTAMP NULL COMMENT 'When first contact was made',
    speed_to_lead_minutes INT NULL COMMENT 'Calculated minutes between creation and contact',
    status VARCHAR(50) DEFAULT 'created' COMMENT 'created, contacted, converted',
    metadata JSON NULL COMMENT 'Additional GHL data',
    system_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When record was created in our system',
    FOREIGN KEY (appointment_setter_id) REFERENCES appointment_setters(id) ON DELETE CASCADE,
    INDEX idx_ghl_lead_id (ghl_lead_id),
    INDEX idx_appointment_setter_id (appointment_setter_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint),
    INDEX idx_processed (processed),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

