-- Migration: Add image_url columns to tables that need them
-- Run this migration to add image upload support

-- Add image_url to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to gram_sabha_meetings table
ALTER TABLE gram_sabha_meetings ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to government_schemes table
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to emergency_alerts table
ALTER TABLE emergency_alerts ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to polls table
ALTER TABLE polls ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to public_suggestions table
ALTER TABLE public_suggestions ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to panchayat_works table
ALTER TABLE panchayat_works ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- Add image_url to faqs table
ALTER TABLE faqs ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;

-- For MySQL versions that don't support IF NOT EXISTS in ALTER TABLE,
-- use these alternative statements (uncomment if needed):

-- ALTER TABLE announcements ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE gram_sabha_meetings ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE government_schemes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE emergency_alerts ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE polls ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE public_suggestions ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE panchayat_works ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE faqs ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;
