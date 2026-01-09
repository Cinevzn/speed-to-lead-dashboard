-- Migration to allow NULL appointment_setter_id for unassigned leads
-- Run this migration to update existing schema

ALTER TABLE leads 
MODIFY COLUMN appointment_setter_id INT NULL,
MODIFY COLUMN status VARCHAR(50) DEFAULT 'unassigned' COMMENT 'created, contacted, converted, unassigned';
