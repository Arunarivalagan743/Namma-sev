-- =====================================================
-- Enhanced Complaint System Migration
-- NammaTirupur Panchayat - Tirupur District
-- =====================================================

USE namsev_db;

-- Add new columns to complaints table
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' AFTER category,
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) AFTER location,
ADD COLUMN IF NOT EXISTS image_url_2 VARCHAR(500) AFTER image_url,
ADD COLUMN IF NOT EXISTS image_url_3 VARCHAR(500) AFTER image_url_2,
ADD COLUMN IF NOT EXISTS estimated_resolution_days INT DEFAULT NULL AFTER admin_remarks,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL AFTER updated_at,
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100) AFTER admin_remarks,
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(15) AFTER location,
ADD COLUMN IF NOT EXISTS ward_number VARCHAR(10) AFTER contact_phone;

-- Add index for priority
CREATE INDEX IF NOT EXISTS idx_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_resolved_at ON complaints(resolved_at);

-- =====================================================
-- Complaint History Table Enhancement
-- =====================================================
ALTER TABLE complaint_history
ADD COLUMN IF NOT EXISTS changed_by VARCHAR(36) AFTER remarks,
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE AFTER changed_by;

-- =====================================================
-- Complaint Images Table (for multiple images)
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_images (
    id VARCHAR(36) PRIMARY KEY,
    complaint_id VARCHAR(36) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    INDEX idx_complaint (complaint_id)
);

-- =====================================================
-- Complaint Notifications Table
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_notifications (
    id VARCHAR(36) PRIMARY KEY,
    complaint_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    notification_type ENUM('status_update', 'assigned', 'resolved', 'reminder') NOT NULL,
    message TEXT NOT NULL,
    sent_via ENUM('email', 'sms', 'push', 'in_app') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_complaint (complaint_id),
    INDEX idx_unread (user_id, is_read)
);

-- =====================================================
-- Complaint Feedback Table
-- =====================================================
CREATE TABLE IF NOT EXISTS complaint_feedback (
    id VARCHAR(36) PRIMARY KEY,
    complaint_id VARCHAR(36) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_complaint (complaint_id)
);

-- =====================================================
-- Ward Master Table (for Tirupur Panchayat)
-- =====================================================
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area_description TEXT,
    councillor_name VARCHAR(100),
    councillor_phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert Tirupur Panchayat Wards
INSERT IGNORE INTO wards (id, name, area_description) VALUES

('W01', 'Ward 1 - Palladam Road', 'Palladam Road area'),


-- =====================================================
-- View for complaint tracking (public access)
-- =====================================================
CREATE OR REPLACE VIEW v_complaint_tracking AS
SELECT 
    c.tracking_id,
    c.title,
    c.category,
    c.priority,
    c.status,
    c.location,
    c.ward_number,
    c.created_at,
    c.updated_at,
    c.estimated_resolution_days,
    c.resolved_at,
    CASE 
        WHEN c.status = 'resolved' THEN 'Your complaint has been resolved'
        WHEN c.status = 'in_progress' THEN 'Your complaint is being processed'
        WHEN c.status = 'rejected' THEN 'Your complaint was not accepted'
        ELSE 'Your complaint is pending review'
    END as status_message
FROM complaints c;
