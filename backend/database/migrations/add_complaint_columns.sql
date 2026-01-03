-- Migration: Add enhanced complaint columns
-- Run this migration to add image upload support and additional tracking features

-- Add image columns to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url_2 VARCHAR(500) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS image_url_3 VARCHAR(500) DEFAULT NULL;

-- Add additional tracking columns
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(15) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ward_number VARCHAR(10) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS estimated_resolution_days INT DEFAULT 10;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_rating INT DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS feedback_comment TEXT DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP DEFAULT NULL;

-- For MySQL versions that don't support IF NOT EXISTS in ALTER TABLE,
-- use these alternative statements (uncomment if needed and comment above):

-- ALTER TABLE complaints ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN image_url_2 VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN image_url_3 VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';
-- ALTER TABLE complaints ADD COLUMN contact_phone VARCHAR(15) DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN ward_number VARCHAR(10) DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN estimated_resolution_days INT DEFAULT 10;
-- ALTER TABLE complaints ADD COLUMN feedback_rating INT DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN feedback_comment TEXT DEFAULT NULL;
-- ALTER TABLE complaints ADD COLUMN resolved_at TIMESTAMP DEFAULT NULL;

-- Add index for priority filtering
CREATE INDEX IF NOT EXISTS idx_priority ON complaints(priority);
